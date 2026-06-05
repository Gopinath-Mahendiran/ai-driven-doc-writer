import json
import os
import re
from base64 import b64decode, b64encode
from subprocess import check_output

import requests
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db import IntegrityError
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from openai import OpenAI
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
import google.generativeai as genai

from .models import project
from .serializers import (
    DocstringRequestSerializer,
    ListProjectsSerializer,
    UserSerializer,
    CustomUserSerializer,
)
from backend.settings import GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
from urllib.parse import unquote
import ast
import asyncio
from  dotenv import load_dotenv

load_dotenv()

token = os.environ["GITHUB_TOKEN"]
GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]
User = get_user_model()

class CreateUserView(generics.CreateAPIView):
# Create your views here.
      queryset = User.objects.all()
      serializer_class = UserSerializer
      permission_classes = [AllowAny]


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = CustomUserSerializer(request.user)
        return Response(serializer.data)
    
class GoogleAuthCallbackView(APIView):
    def post(self, request):

        code = request.GET.get("code")

        if not code:
            return JsonResponse({"error": "No code provided"}, status=400)

        # Exchange code for tokens
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "code": code,
            "client_id": "526839746953-b15518oosomdgi87u0je0v42g6dohj0r.apps.googleusercontent.com",
            "client_secret": "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",
            "redirect_uri": "https://ai-driven-doc-writer-hubn.vercel.app/oauth/callback/",
            "grant_type": "authorization_code",
        }

        token_resp = requests.post(token_url, data=data)
        print(f"Token response: {token_resp.status_code} ")
        if token_resp.status_code != 200:
            return JsonResponse({"error": "Token exchange failed"}, status=400)

        tokens = token_resp.json()
        id_token_str = tokens.get("id_token")

        # Verify id_token
        try:
            id_info = id_token.verify_oauth2_token(
                id_token_str,
                google_requests.Request(),
                "526839746953-b15518oosomdgi87u0je0v42g6dohj0r.apps.googleusercontent.com"
            )
            email = id_info["email"]
            name = id_info.get("name", "")
            profile_pic = id_info.get("picture")
            user, _ = User.objects.get_or_create(email=email, defaults={"username": email.split('@')[0], "first_name": name})
            if profile_pic:
                user.profile_pic = profile_pic
                user.save()
            # Issue your own JWT
            refresh = RefreshToken.for_user(user)
            profile ={
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "email": email,
                    "name": name,
                    "profile_pic": profile_pic if profile_pic else "",
                }
            }
            print(profile)
            return JsonResponse(profile, status=200)

        except Exception as e:
            return Response({"error": "ID token verification failed", "details": str(e)}, status=400)

class GitHubConnectionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get("code")
        if not code:
            return JsonResponse({"error": "No code provided"}, status=400)

        try:
            token_response = requests.post(
                "https://github.com/login/oauth/access_token",
                headers={"Accept": "application/json"},
                data={"client_id": GITHUB_CLIENT_ID, "client_secret": GITHUB_CLIENT_SECRET, "code": code},
                timeout=10
            )
            token_response.raise_for_status()
        except requests.RequestException as e:
            return JsonResponse({"error": "Failed to connect to GitHub", "details": str(e)}, status=400)
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        print(f"Access token: {access_token}")
        if not access_token:
            return JsonResponse({"error": "Failed to obtain access token"}, status=400)

        try:
            user_info_response = requests.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10
            )
            user_info_response.raise_for_status()
            user_info = user_info_response.json()
            github_username = user_info.get("login")
            if not github_username:
                return JsonResponse({"error": "Failed to obtain GitHub username"}, status=400)
        except requests.RequestException:
            return JsonResponse({"error": "Failed to fetch user info from GitHub."}, status=400)

        user = request.user
        user.github_token = access_token
        user.github_username = github_username
        user.is_github_connected = True
        user.save()

        return JsonResponse({"is_github_connected": user.is_github_connected}, status=200)


class sampleView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        print(request.user)
        return JsonResponse({"message": "Hello, world!"})
        

class GetUserRepositoriesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.is_github_connected:
            return JsonResponse({"error": "User is not connected to GitHub"}, status=400)
        # Check cache first
        cached_repos = cache.get(f"user_repositories:{user.id}")
        
        try:
            response = requests.get(
                "https://api.github.com/user/repos",
                headers={"Authorization": f"Bearer {user.github_token}"},
                timeout=10
            )
            response.raise_for_status()
            repos = response.json()
            data = {}
            for repo in repos:
                data[repo['id']] = {
                    "name": repo['name'],
                    "description": repo['description'],
                    "url": repo['html_url'],
                    "language": repo['language'],
                    "stars": repo['stargazers_count'],
                    "forks": repo['forks_count']
                }

            print("Repositories fetched")
            return JsonResponse(data, safe=False)
        except requests.RequestException as e:
            return JsonResponse({"error": "Failed to fetch user repositories", "details": str(e)}, status=400)

class GetRepoFileTreeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request , repo_name=None):
        user = request.user
        if not user.is_github_connected:
            return JsonResponse({"error": "User is not connected to GitHub"}, status=400)
        
        repo = request.GET.get("repo_name")
        try:
            response = requests.get(
                f"https://api.github.com/repos/{user.github_username}/{repo_name}/git/trees/main?recursive=1",
                headers={"Authorization": f"Bearer {user.github_token}"},
                timeout=10
            )
            response.raise_for_status()
            tree_data = response.json()
            tree = []
            for item in tree_data.get("tree", []):
                tree.append({
                    "path": item['path'],
                    "type": item['type']
                })
            return JsonResponse({"file_tree": tree}, safe=False)
        except requests.RequestException as e:
            return JsonResponse({"error": "Failed to fetch repository file tree", "details": str(e)}, status=400)

class GetFileContentView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, repo_name=None, file_path=None):

        user = request.user
        symbols = list()
        if not user.is_github_connected:
            return JsonResponse({"error": "User is not connected to GitHub"}, status=400)
        
        if not file_path or not repo_name:
            return JsonResponse({"error": "file_path and repo_name parameters are required."}, status=400)

        # Decode URI-encoded file_path
        decoded_file_path = unquote(file_path)
        print(f"Decoded file path: {decoded_file_path}")
        try:
            response = requests.get(
                f"https://api.github.com/repos/{user.github_username}/{repo_name}/contents/{decoded_file_path}",
                headers={"Authorization": f"Bearer {user.github_token}"},
                timeout=10
            )
            response.raise_for_status()
            content_data = response.json()
            if 'content' in content_data:
                content_data['content'] = b64decode(content_data['content']).decode('utf-8')
            else:
                content_data['content'] = "No content found for this file."
            
            symbols = GenerateSymbolTable(content_data['content'])

            content_data['symbols'] = symbols
            return JsonResponse(content_data, safe=False)
        except requests.RequestException as e:
            return JsonResponse({"error": "Failed to fetch file content", "details": str(e)}, status=400)


class ListProjectsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        projects = project.objects.filter(owner=request.user).order_by('-created_at')
        serializer = ListProjectsSerializer(projects, many=True)
        return JsonResponse(serializer.data, safe=False)
    
class GitlinkValidation(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        gitlink = request.GET.get("gitlink")
        try:
            owner, repo = parse_github_url(gitlink)
            curl_command = curl_command = ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",f"https://api.github.com/repos/{owner}/{repo[:-4]}"]
            status = check_output(curl_command, text=True).strip()
        except:
            return JsonResponse({
                "status": 0
            })
        if status == "200":
            return JsonResponse({
                "status": 1
            })
        else:
            return JsonResponse({
                "status": 0
            })


class GenerateDocstringView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = DocstringRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return JsonResponse(serializer.errors, status=400)

        code = serializer.validated_data.get('code')
        CustomizationOptions = serializer.validated_data.get('customizationOptions', {})
        if not code:
            return JsonResponse({"error": "Code is required."}, status=400)
        print(f"Received code: {code[:100]}...")  # Log first 100 characters for debugging
        # try:
        docstring = asyncio.run(generate_docstring(code, CustomizationOptions))
        print(f"Generated docstring: {docstring}")
        return JsonResponse({
            "code": code,
            "docstring": docstring,
            "repo_name": serializer.validated_data.get('repo_name', ''),
            "file_path": serializer.validated_data.get('file_path', ''),
        }, status=200)
        # except Exception as e:
        #     return JsonResponse({"error": str(e)}, status=500)

def parse_github_url(url):
    match = re.search(r"github\.com/([^/]+)/([^/]+)", url)
    if match:
        owner, repo = match.group(1), match.group(2)
        print("Owner:", owner)
        print("Repo:", repo)
    else:
        print("Invalid GitHub URL")
    return match.group(1), match.group(2)  # Remove '.git' from repo name




async def generate_docstring(code, customizationOptions):
    """
    Generate docstrings using Google Generative AI (Gemini).
    
    Args:
        code (str): Python code to generate docstrings for
        customizationOptions (dict): Customization options for docstring generation
        
    Returns:
        str: Generated code with docstrings
    """
    # Initialize Google Generative AI
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY is not set in environment variables.")
    
    genai.configure(api_key=api_key)
    
    # Extract customization options
    style = customizationOptions.get("style", "PEP257")
    verbosity = customizationOptions.get("verbosity", "Standard")
    audience = customizationOptions.get("audience", "Intermediate")
    tone = customizationOptions.get("tone", "Neutral")
    purpose = customizationOptions.get("purpose", "API Reference")

    print(f"Customization options: {customizationOptions}")

    # Build system prompt dynamically
    system_prompt = (
        f"You are a senior Python developer and documentation expert.\n"
        f"You follow the {style} docstring standard.\n"
        f"Verbosity level: {verbosity}.\n"
        f"Target audience: {audience}.\n"
        f"Tone: {tone}.\n"
        f"Documentation purpose: {purpose}.\n"
        f"Your job is to generate only clean Python docstrings.\n"
        f"Include file-level module docstring.\n"
        f"Do not explain, comment, or write anything outside of the docstrings.\n"
        f"Do not include conversational text or markdown formatting.\n"
    )

    # Create the generative model
    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        system_instruction=system_prompt
    )

    user_message = (
        "Add docstrings ONLY to all functions, classes, and the module in the following code. "
        "Return ONLY the updated code with embedded docstrings in-place. "
        "Avoid extra commentary or explanation outside the code.\n\n"
        f"{code}"
    )

    # Generate content
    response = model.generate_content(user_message)
    
    return response.text.strip()


def GenerateSymbolTable(code):
    """
    Generate a symbol table from the provided code.
    This function parses the code and extracts classes, functions, and their attributes.
    """
    tree = ast.parse(code)
    symbols = []

    def Traversal(node, parent_list):
        if isinstance(node, ast.ClassDef):
            class_info = {
                "type": "class",
                "name": node.name,
                "line": node.lineno,
                "children": []
            }
            for item in node.body:
                Traversal(item, class_info["children"])
            parent_list.append(class_info)
        elif isinstance(node, ast.FunctionDef):
            parent_list.append({
                "type": "function",
                "name": node.name,
                "line": node.lineno,
                "children": []
            })
            for item in node.body:
                Traversal(item, parent_list[-1]["children"])
        elif isinstance(node, ast.Constant):
            parent_list.append({
                "type": "constant",
                "value": node.value,
                "line": node.lineno
            })
        elif hasattr(node, 'body'):
            for item in getattr(node, 'body', []):
                Traversal(item, parent_list)

    Traversal(tree, symbols)
    return symbols


def commit_changes_to_github(github_token, github_username, repo_name, file_path, new_content, commit_message, branch="main"):
    """
    Commit changes to a file in a GitHub repository using the GitHub REST API.
    
    Args:
        github_token (str): GitHub personal access token
        github_username (str): GitHub username
        repo_name (str): Repository name
        file_path (str): Path to the file in the repository
        new_content (str): New content of the file
        commit_message (str): Commit message
        branch (str): Target branch (default: main)
    
    Returns:
        dict: Response from GitHub API containing commit info or error details
    """
    try:
        # Get the current file SHA (needed for updates)
        get_url = f"https://api.github.com/repos/{github_username}/{repo_name}/contents/{file_path}"
        headers = {
            "Authorization": f"Bearer {github_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28"
        }
        
        # Try to get existing file
        get_response = requests.get(
            get_url,
            params={"ref": branch},
            headers=headers,
            timeout=10
        )
        
        sha = None
        if get_response.status_code == 200:
            sha = get_response.json().get("sha")
            print(f"Found existing file with SHA: {sha}")
        elif get_response.status_code != 404:
            return {
                "success": False,
                "error": f"Failed to fetch file info: {get_response.status_code}",
                "details": get_response.text
            }
        
        # Encode the new content to base64
        content_encoded = b64encode(new_content.encode('utf-8')).decode('utf-8')
        
        # Prepare the commit payload
        payload = {
            "message": commit_message,
            "content": content_encoded,
            "branch": branch
        }
        
        if sha:
            payload["sha"] = sha
        
        # Commit to GitHub
        commit_url = f"https://api.github.com/repos/{github_username}/{repo_name}/contents/{file_path}"
        commit_response = requests.put(
            commit_url,
            json=payload,
            headers=headers,
            timeout=10
        )
        
        if commit_response.status_code in [200, 201]:
            commit_data = commit_response.json()
            return {
                "success": True,
                "message": "Changes committed successfully",
                "commit": {
                    "sha": commit_data.get("commit", {}).get("sha"),
                    "url": commit_data.get("commit", {}).get("html_url"),
                    "file_url": commit_data.get("content", {}).get("html_url")
                }
            }
        else:
            return {
                "success": False,
                "error": f"Failed to commit: {commit_response.status_code}",
                "details": commit_response.text
            }
    
    except requests.RequestException as e:
        return {
            "success": False,
            "error": "Request failed",
            "details": str(e)
        }
    except Exception as e:
        return {
            "success": False,
            "error": "An error occurred",
            "details": str(e)
        }


class GitCommitView(APIView):
    """
    API endpoint for committing changes to GitHub repositories.
    
    POST request should include:
    - repo_name (str): Name of the repository
    - file_path (str): Path to the file in the repository
    - content (str): New file content
    - commit_message (str): Commit message
    - branch (str, optional): Target branch (default: main)
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        
        # Verify user is connected to GitHub
        if not user.is_github_connected:
            return JsonResponse(
                {"error": "User is not connected to GitHub"},
                status=400
            )
        
        # Extract request data
        repo_name = request.data.get("repo_name")
        file_path = request.data.get("file_path")
        new_content = request.data.get("content")
        commit_message = request.data.get("commit_message")
        branch = request.data.get("branch", "main")
        
        # Validate required fields
        if not all([repo_name, file_path, new_content, commit_message]):
            return JsonResponse(
                {
                    "error": "Missing required fields",
                    "required": ["repo_name", "file_path", "content", "commit_message"]
                },
                status=400
            )
        
        # Execute commit
        result = commit_changes_to_github(
            github_token=user.github_token,
            github_username=user.github_username,
            repo_name=repo_name,
            file_path=file_path,
            new_content=new_content,
            commit_message=commit_message,
            branch=branch
        )
        
        if result["success"]:
            return JsonResponse(result, status=201)
        else:
            return JsonResponse(result, status=400)

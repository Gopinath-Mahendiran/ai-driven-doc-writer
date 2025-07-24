import json
import os
import re
from base64 import b64decode
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

from .models import project
from .serializers import (
    AddProjectSerializer,
    DocstringRequestSerializer,
    ListProjectsSerializer,
    UserSerializer,
    CustomUserSerializer,
)
from backend.settings import GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
from urllib.parse import unquote

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
            "redirect_uri": "http://localhost:5173/oauth/callback/",
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
        docstring = generate_docstring(code,CustomizationOptions)
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




def generate_docstring(code, customizationOptions):
    endpoint = "https://models.github.ai/inference"
    model = "openai/gpt-4.1"
    client = OpenAI(base_url=endpoint, api_key=token)

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

    response = client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": (
                    "Add docstrings ONLY to all functions, classes, and the module in the following code. "
                    "Return ONLY the updated code with embedded docstrings in-place. "
                    "Avoid extra commentary or explanation outside the code.\n\n"
                    f"{code}"
                ),
            },
        ],
        temperature=0.7,
        top_p=1.0,
        model=model
    )
    return response.choices[0].message.content.strip()


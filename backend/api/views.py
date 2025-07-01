import json
import os
import re
from base64 import b64decode
from subprocess import check_output

import requests
from django.contrib.auth.models import User
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
)

token = os.environ["GITHUB_TOKEN"]
GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]

class CreateUserView(generics.CreateAPIView):
# Create your views here.
      queryset = User.objects.all()
      serializer_class = UserSerializer
      permission_classes = [AllowAny]


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
            user, _ = User.objects.get_or_create(email=email, defaults={"username": email.split('@')[0], "first_name": name})

            # Issue your own JWT
            refresh = RefreshToken.for_user(user)
            data ={"access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "email": email,
                    "name": name
                }}
            print(data)
            return JsonResponse({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "email": email,
                    "name": name
                }
            })

        except Exception as e:
            return Response({"error": "ID token verification failed", "details": str(e)}, status=400)
        
class sampleView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        print(request.user)
        return JsonResponse({"message": "Hello, world!"})
        

class AddProjectView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = AddProjectSerializer(data=request.data)
        if not serializer.is_valid():
            return JsonResponse(serializer.errors, status=400)

        name = serializer.validated_data.get('name')
        description = serializer.validated_data.get('description', '')
        repository_url = serializer.validated_data.get('repository_url')
        branch = serializer.validated_data.get('branch', 'master')
        git_token = None
        if not name:
            return JsonResponse({"error": "Project name is required."}, status=400)
        if not repository_url:
            return JsonResponse({"error": "repository_url is required."}, status=400)

        owner, repo = None, None
        if repository_url:
            try:
                owner, repo = parse_github_url(repository_url)
            except Exception:
                return JsonResponse({"error": "Invalid repository URL."}, status=400)
            if not owner or not repo:
                return JsonResponse({"error": "Invalid repository URL."}, status=400)

        curl_command = ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}"]
        if git_token:
            curl_command += ["-H", f"Authorization: Bearer {git_token}"]
        curl_command.append(f"https://api.github.com/repos/{owner}/{repo}/branches/{branch}")

        try:
            status_code = check_output(curl_command, text=True).strip()
            print(f"Status code: {status_code}")
            if status_code != "200":
                return JsonResponse({"error": "repository not found or branch does not exist."}, status=400)
        except Exception as e:
            return JsonResponse({"error": "Failed to check repository or branch.", "details": str(e)}, status=400)

        try:
            proj = project.objects.create(
                owner=request.user,
                name=name,
                description=description,
                repository_url=repository_url,
                branch=branch
            )
            return JsonResponse({
                "id": proj.id,
                "name": proj.name,
                "description": proj.description,
                "repository_url": proj.repository_url,
                "branch": proj.branch
            })
        except IntegrityError as e:
            return JsonResponse({"error": "Project with this repository URL already exists."}, status=400)
        except Exception as e:
            print(f"Error creating project: {e}")
            return JsonResponse({"error": "Failed to create project.", "details": str(e)}, status=500)

class ListProjectsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        projects = project.objects.filter(owner=request.user).order_by('-created_at')
        serializer = ListProjectsSerializer(projects, many=True)
        return JsonResponse(serializer.data, safe=False)

@method_decorator(csrf_exempt, name='dispatch')
class GenerateDocstringView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = DocstringRequestSerializer(data=request.data)
        if serializer.is_valid():
            code = serializer.validated_data.get('code')
            file_path = serializer.validated_data.get('file_path')
            repo_url = serializer.validated_data.get('repo_url')
            branch = serializer.validated_data.get('branch')


            try:
                if not code and file_path and repo_url:
                    file_content = cache.get(f"file_content:{repo_url}:{file_path}")
                    if file_content:
                        print("Cache hit for file content")
                        code = file_content
                    code = read_file_content(repo_url,file_path,branch)

                result = generate_docstring(code)

                return JsonResponse({
                    "updated_code": result,
                    "source": "file" if file_path else "snippet",
                    "highlighted": True  # For frontend UI to trigger highlighting
                })
            except ValueError as e:
                return Response({"error": "file_path and repo_url required"}, status=400)

            except Exception as e:
                return JsonResponse({"error": str(e)}, status=500)

        return JsonResponse(serializer.errors, status=400)


@csrf_exempt
def gitrepo(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            repo_url = data.get('repo_url')
            branch = data['branch'] if data['branch'] else "master" # Default to 'master' if no branch is specified
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON body."}, status=400)

        if not repo_url:
            return JsonResponse({"error": "repo_url parameter is required."}, status=400)
        
        data = cache.get(f"file_tree:{repo_url}:{branch}") 
        if data :
            print("Cache hit for file tree")
            return JsonResponse(data)
        
        try:
            data = fetch_file_tree(repo_url,branch)
            print("Cache miss for file tree, fetching from GitHub")
            cache.set(f"file_tree:{repo_url}:{branch}", data, timeout=60*60)
            return JsonResponse(data)
        except ValueError as e:
            return JsonResponse({"error": str(e)}, status=400)
        except requests.RequestException:
            return JsonResponse({"error": "Failed to fetch data from GitHub."}, status=500)
    
    return JsonResponse({"error": "Invalid request method."}, status=405)


def parse_github_url(url):
    match = re.match(r"https://github\.com/([^/]+)/([^/]+)", url)
    if not match:
        raise ValueError("Invalid GitHub repo URL.")
    return match.group(1), match.group(2)[:-4]  # Remove '.git' from repo name



@csrf_exempt
def get_repo_file_tree(owner, repo, branch, token=None):
    file_paths=[]    
    headers = {"Authorization": f"token {token}"} if token else {}

    # Get the SHA of the default branch
    branch_data = requests.get(
        f"https://api.github.com/repos/{owner}/{repo}/branches/{branch}",
        headers=headers
    ).json() 
    
    sha = branch_data["commit"]['commit']["tree"]["sha"]

    # Get the full recursive tree
    tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{sha}?recursive=1"
    tree_data = requests.get(tree_url, headers=headers).json()
    for file in tree_data.get("tree", []):
        file_paths.append(file["path"])
    
    return {"file_tree": file_paths}


def fetch_file_tree(repo_url,branch):

    owner, repo = parse_github_url(repo_url)
    tree = get_repo_file_tree(owner, repo, branch)  # Remove '.git' from repo name
    return tree


@csrf_exempt
def get_file_content(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)  
            file_path = data.get('file_path')
            repo_url = data.get('repo_url')
            branch = data['branch'] if data['branch'] else "master" # Default to 'master' if no branch is specified
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON body."}, status=400)
        return JsonResponse(read_file_content(repo_url, file_path, branch))
    return JsonResponse({"error": "Invalid request method."}, status=405)


       


def read_file_content(repo_url, file_path, branch):
        if  not file_path or  not repo_url:
            return {"error": "file_path and repo_url parameters are required."}
        
        data = cache.get(f"file_content:{repo_url}:{branch}:{file_path}")
        if data:
            print("Cache hit for file content")
            return JsonResponse(data, safe=False)

        owner, repo = parse_github_url(repo_url)
      #   headers = {"Authorization": f"token {data.get('token')}"}
        
        file_content_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{file_path}?ref={branch}"
        response = requests.get(file_content_url, headers={})
        
        if response.status_code == 200:
            content_data = response.json()
            if 'content' in content_data:

                content_data['content'] = b64decode(content_data['content']).decode('utf-8')
            else:
                content_data['content'] = "No content found for this file."
            cache.set(f"file_content:{repo_url}:{branch}:{file_path}", content_data['content'], timeout=60*60)  # Cache for 1 hour
            return content_data['content']
        else:
            return {"error": "Failed to fetch file content."}

       
        

def generate_docstring(code):
        
        
        endpoint = "https://models.github.ai/inference"
        model = "openai/gpt-4.1"
        client = OpenAI(base_url=endpoint, api_key=token)
        response = client.chat.completions.create(
            messages = [
        {
        "role": "system",
        "content": 
            "You are a senior Python developer and documentation expert. "
            "You strictly follow PEP 257 and PEP 8 docstring standards. "
            "You generate ONLY clean Python docstrings and a file-level module docstring. "
            "Do NOT explain or comment on the code. "
            "Do NOT write anything outside of the docstrings. "
            "Do NOT include conversational text or markdown formatting."
        
        },
        {
        "role": "user",
        "content": 
            "Add docstrings ONLY to all functions, classes, and the module in the following code. "
            "Return ONLY the updated code with embedded docstrings in-place. "
            "Avoid extra commentary or explanation outside the code.\n\n"
            f"{code}"
        
    }
],
            temperature=0.7,
            top_p=1.0,
            model= model
        )
        return response.choices[0].message.content.strip()




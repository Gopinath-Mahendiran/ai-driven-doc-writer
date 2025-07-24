from django.urls import path
from . import views  # Import your views
from .views import GenerateDocstringView, sampleView , GitHubConnectionView

urlpatterns = [
    path('generate-docstring/',GenerateDocstringView.as_view(), name='generate_docstring'),
    path('sample/', sampleView.as_view(), name='sample_view'),
    path('get/connection-status/', GitHubConnectionView.as_view(), name='get_connection_status'),
    path('get/repositories/',views.GetUserRepositoriesView.as_view(), name='get_repositories'),
    path('get/current-status/', views.CurrentUserView.as_view(), name='get_current_status'),
    path('get/repository-files/<str:repo_name>/', views.GetRepoFileTreeView.as_view(), name='get_repository_files'),
    path('get/file-content/<str:repo_name>/<path:file_path>/', views.GetFileContentView.as_view(), name='get_file_content'),
]
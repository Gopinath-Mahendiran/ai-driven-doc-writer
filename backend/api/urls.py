from django.urls import path
from . import views  # Import your views
from .views import GenerateDocstringView, sampleView

urlpatterns = [
    path('gitrepo/', views.gitrepo, name='gitrepo'),
    path('filecontent/',views.get_file_content, name='filecontent'),
    path('generate-docstring/',GenerateDocstringView.as_view(), name='generate_docstring'),
    path('sample/', sampleView.as_view(), name='sample_view'),
    path('add-project/', views.AddProjectView.as_view(), name='add_project'),
    path('list-projects/', views.ListProjectsView.as_view(), name='list_projects'),
]
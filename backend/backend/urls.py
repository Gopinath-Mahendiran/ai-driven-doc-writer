from django.contrib import admin
from django.urls import path,include
from api.views import CreateUserView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api.views import GoogleAuthCallbackView, GitHubConnectionView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/user/register/", CreateUserView.as_view(), name="register"),
    path("api/token/", TokenObtainPairView.as_view(), name="get_token"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="refresh_token"),
    path("api/code/", include("api.urls")),
    path('api/auth/callback/', GoogleAuthCallbackView.as_view(), name='google_callback'),
    path('api/github/callback/', GitHubConnectionView.as_view(), name='github_callback'),
]





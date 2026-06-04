from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import project

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "password",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "github_username",
            "is_github_connected",
        ]
        read_only_fields = ["id", "github_username", "is_github_connected"]


class AddProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = project
        fields = [
            "id",
            "name",
            "description",
            "repository_url",
            "branch",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def create(self, validated_data):
        request = self.context.get("request")
        if request and hasattr(request, "user"):
            validated_data["owner"] = request.user
        return super().create(validated_data)


class ListProjectsSerializer(serializers.ModelSerializer):
    class Meta:
        model = project
        fields = [
            "id",
            "name",
            "description",
            "repository_url",
            "branch",
            "created_at",
            "updated_at",
        ]


class DocstringRequestSerializer(serializers.Serializer):
    code = serializers.CharField()
    customizationOptions = serializers.DictField(
        child=serializers.CharField(), required=False, default=dict
    )
    repo_name = serializers.CharField(required=False, allow_blank=True)
    file_path = serializers.CharField(required=False, allow_blank=True)

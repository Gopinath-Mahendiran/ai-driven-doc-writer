from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework import generics

class UserSerializer(serializers.ModelSerializer):

      class Meta:
            model = User
            fields = ['id','username','password',"email"]
            extra_kwargs = {'password' : {'write_only' : True}}

      def create(self,validated_data):
            user = User.objects.create_user(**validated_data)
            return user

class DocstringRequestSerializer(serializers.Serializer):
    code = serializers.CharField(required=False)
    file_path = serializers.CharField(required=False)
    repo_url = serializers.CharField(required=False)
    branch = serializers.CharField(required=False)

    def validate(self, data):
        code = data.get("code")
        file_path = data.get("file_path")
        repo_url = data.get("repo_url")
        branch = data.get("branch")

        if not code and not file_path:
            raise serializers.ValidationError("Provide either 'code' or 'file_path'.")

        if file_path:
            if not repo_url or not branch:
                raise serializers.ValidationError("If 'file_path' is provided, 'url' and 'branch' are required.")

        return data
    
class AddProjectSerializer(serializers.Serializer):

    class Meta:
        model = User
        fields = ['name', 'description', 'repository_url', 'branch']
    name = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    repository_url = serializers.URLField(max_length=255, required=False, allow_blank=False)
    branch = serializers.CharField(max_length=100, required=False, allow_blank=True)

    def validate(self, data):
        if not data.get('name'):
            raise serializers.ValidationError("Project name is required.")
        if not data.get('repository_url'):
            raise serializers.ValidationError("Repository URL is required.")
        return data
    
class ListProjectsSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'repository_url', 'branch', 'created_at', 'updated_at']

    id = serializers.IntegerField(read_only=True)
    name = serializers.CharField(max_length=255)
    repository_url = serializers.URLField(max_length=255, required=False, allow_blank=False)
    branch = serializers.CharField(max_length=100, required=False, allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)


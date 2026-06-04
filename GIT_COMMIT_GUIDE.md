# Git Commit Functionality Guide

This guide explains how to use the new Git commit functionality that has been added to the backend API.

## Overview

The new `GitCommitView` and `commit_changes_to_github()` function allow you to:
- Commit file changes directly to GitHub repositories
- Automatically handle file creation and updates
- Push changes to any branch in your repository
- Receive detailed feedback on commit status

## Backend Implementation

### Function: `commit_changes_to_github()`

**Location:** [api/views.py](backend/api/views.py)

**Purpose:** Core function that handles committing changes to GitHub using the GitHub REST API.

**Parameters:**
- `github_token` (str): User's GitHub personal access token
- `github_username` (str): GitHub username
- `repo_name` (str): Repository name
- `file_path` (str): Path to the file in the repository
- `new_content` (str): New content of the file
- `commit_message` (str): Commit message describing the changes
- `branch` (str, optional): Target branch (defaults to "main")

**Returns:**
```python
{
    "success": True,  # Boolean indicating success
    "message": "Changes committed successfully",
    "commit": {
        "sha": "abc123...",  # Commit SHA
        "url": "https://github.com/.../commit/abc123...",  # Commit URL
        "file_url": "https://github.com/.../blob/main/path/to/file"  # File URL
    }
}
```

**Error Response:**
```python
{
    "success": False,
    "error": "Error description",
    "details": "Detailed error message"
}
```

### API Endpoint: `POST /api/commit/`

**Authentication:** Required (IsAuthenticated)

**Description:** REST API endpoint for committing changes.

**Request Body:**
```json
{
    "repo_name": "my-repo",
    "file_path": "path/to/file.py",
    "content": "# New file content\nprint('Hello')",
    "commit_message": "Add documentation to file",
    "branch": "main"  // optional, defaults to "main"
}
```

**Required Fields:**
- `repo_name`: Name of your GitHub repository
- `file_path`: Path where the file should be created/updated
- `content`: New content for the file
- `commit_message`: A descriptive commit message

**Optional Fields:**
- `branch`: Target branch (defaults to "main")

**Success Response (201):**
```json
{
    "success": true,
    "message": "Changes committed successfully",
    "commit": {
        "sha": "a1b2c3d4...",
        "url": "https://github.com/username/repo/commit/a1b2c3d4...",
        "file_url": "https://github.com/username/repo/blob/main/path/to/file.py"
    }
}
```

**Error Response (400):**
```json
{
    "error": "Missing required fields",
    "required": ["repo_name", "file_path", "content", "commit_message"]
}
```

## Frontend Usage

### Example: Using with React

```javascript
// api.js or apiService.js

export const commitChangesToGitHub = async (commitData) => {
    const response = await fetch('/api/commit/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(commitData)
    });

    if (!response.ok) {
        throw new Error('Failed to commit changes');
    }

    return await response.json();
};

// Usage in a React component

import { commitChangesToGitHub } from './api';

// Inside your component or handler function
async function handleCommitDocstrings() {
    try {
        const commitData = {
            repo_name: 'my-project',
            file_path: 'src/main.py',
            content: generatedCodeWithDocstrings,  // The updated code
            commit_message: 'docs: Add AI-generated docstrings using ai-driven-doc-writer',
            branch: 'main'  // optional
        };

        const response = await commitChangesToGitHub(commitData);
        
        if (response.success) {
            console.log('Commit successful!');
            console.log('Commit URL:', response.commit.url);
            console.log('File URL:', response.commit.file_url);
            // Show success message to user
            alert(`Changes committed successfully!\nView commit: ${response.commit.url}`);
        } else {
            console.error('Commit failed:', response.error);
            alert(`Commit failed: ${response.error}`);
        }
    } catch (error) {
        console.error('Error during commit:', error);
        alert('An error occurred while committing changes');
    }
}
```

### Complete Integration Example

```javascript
// components/DocEditor.jsx or similar

import { useState } from 'react';
import { generateDocstring, commitChangesToGitHub } from '../api';

export default function DocEditor() {
    const [originalCode, setOriginalCode] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [isCommitting, setIsCommitting] = useState(false);

    const handleGenerateDocstring = async () => {
        try {
            const result = await generateDocstring({
                code: originalCode,
                repo_name: 'my-repo',
                file_path: 'src/example.py',
                customizationOptions: {
                    style: 'PEP257',
                    verbosity: 'Standard',
                    audience: 'Intermediate',
                    tone: 'Neutral',
                    purpose: 'API Reference'
                }
            });
            setGeneratedCode(result.docstring);
        } catch (error) {
            console.error('Failed to generate docstring:', error);
        }
    };

    const handleCommitChanges = async () => {
        setIsCommitting(true);
        try {
            const response = await commitChangesToGitHub({
                repo_name: 'my-repo',
                file_path: 'src/example.py',
                content: generatedCode,
                commit_message: 'docs: Add AI-generated docstrings',
                branch: 'main'
            });

            if (response.success) {
                alert(`✅ Committed successfully!\nView: ${response.commit.file_url}`);
                setGeneratedCode('');  // Clear after successful commit
            } else {
                alert(`❌ Commit failed: ${response.error}`);
            }
        } catch (error) {
            alert('Error during commit: ' + error.message);
        } finally {
            setIsCommitting(false);
        }
    };

    return (
        <div className="doc-editor">
            <textarea 
                value={originalCode}
                onChange={(e) => setOriginalCode(e.target.value)}
                placeholder="Paste your code here"
            />
            
            <button onClick={handleGenerateDocstring}>
                Generate Docstrings
            </button>

            {generatedCode && (
                <>
                    <textarea 
                        value={generatedCode}
                        readOnly
                        placeholder="Generated code will appear here"
                    />
                    
                    <button 
                        onClick={handleCommitChanges}
                        disabled={isCommitting}
                    >
                        {isCommitting ? 'Committing...' : 'Commit to GitHub'}
                    </button>
                </>
            )}
        </div>
    );
}
```

## Prerequisites

1. **User must be connected to GitHub:**
   - User must have authenticated via GitHub OAuth
   - `user.is_github_connected` must be `True`
   - Valid `github_token` and `github_username` stored in user profile

2. **Permissions:**
   - GitHub token must have `repo` scope to read and write to repositories
   - User must have write access to the target repository

## How It Works

1. **Authentication Check:** Verifies user is connected to GitHub
2. **Fetch File Info:** Checks if file exists and retrieves its SHA (needed for updates)
3. **Encode Content:** Encodes file content to base64 (GitHub API requirement)
4. **Create/Update Commit:** Uses GitHub API's "Create or update file contents" endpoint
5. **Return Response:** Returns commit details or error information

## Features

✅ **Automatic File Creation:** Creates new files if they don't exist
✅ **Update Existing Files:** Updates files with new content
✅ **Branch Support:** Can commit to any branch
✅ **Detailed Responses:** Returns commit SHA, URLs, and status
✅ **Error Handling:** Comprehensive error messages for debugging
✅ **Authentication:** Requires user GitHub connection

## Example Workflow

1. User selects a file from their GitHub repo
2. Frontend fetches file content
3. User generates AI docstrings using the `GenerateDocstringView`
4. Frontend displays the generated code with docstrings
5. User clicks "Commit to GitHub"
6. Frontend sends POST request to `/api/commit/` with:
   - The file path
   - The generated code with docstrings
   - A descriptive commit message
7. Backend commits changes directly to GitHub
8. Success response shows commit link
9. Changes are immediately visible on GitHub

## Testing

### Test with cURL

```bash
curl -X POST http://localhost:8000/api/commit/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "repo_name": "test-repo",
    "file_path": "test.py",
    "content": "# Test file\nprint(\"Hello\")",
    "commit_message": "Test commit from API",
    "branch": "main"
  }'
```

### Test with Python

```python
import requests
import json

url = "http://localhost:8000/api/commit/"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {your_jwt_token}"
}

data = {
    "repo_name": "test-repo",
    "file_path": "docs/example.py",
    "content": "def hello():\n    \"\"\"Say hello.\"\"\"\n    print('Hello')",
    "commit_message": "Add docstring to hello function"
}

response = requests.post(url, headers=headers, json=data)
print(response.json())
```

## Troubleshooting

### Issue: "User is not connected to GitHub"
- Ensure user has authenticated via GitHub OAuth
- Check that `github_token` is saved in user profile

### Issue: "Missing required fields"
- Verify all required fields are present: `repo_name`, `file_path`, `content`, `commit_message`

### Issue: "Failed to commit: 404"
- Repository doesn't exist or is private
- User doesn't have access to the repository

### Issue: "Failed to commit: 422"
- File path might be invalid
- GitHub API validation error (check details in response)

## Security Considerations

- Tokens are stored securely in the user model
- All requests require authentication
- File paths are validated
- Base64 encoding prevents content injection
- HTTPS is required for production

## Future Enhancements

Potential improvements:
- Support for committing to multiple files in one request
- Automatic branch creation
- Pull request creation instead of direct commit
- Commit history tracking
- Rollback functionality

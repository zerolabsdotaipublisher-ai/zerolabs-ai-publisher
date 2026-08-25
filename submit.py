import json

def generate_submit_args():
    return json.dumps({
        "branch_name": "feature/community-feed-dashboard",
        "commit_message": "fix: update dashboard api summary route with try-catch and log",
        "title": "feat: 3 column community feed layout",
        "description": "Fixes dashboard fallback, updates layout to 3 columns"
    })
print(generate_submit_args())

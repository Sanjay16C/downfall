from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import praw
from praw.models import MoreComments
from dotenv import load_dotenv
import os
import datetime
from collections import Counter

load_dotenv()

app = FastAPI()

# Allow frontend (React) to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Reddit API setup
reddit = praw.Reddit(
    client_id=os.getenv("REDDIT_CLIENT_ID"),
    client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
    user_agent=os.getenv("REDDIT_USER_AGENT")
)

@app.get("/user_data/")
def get_user_data(profile_url: str = Query(...)):
    try:
        username = profile_url.rstrip("/").split("/")[-1]
        redditor = reddit.redditor(username)

        # User meta
        user_info = {
            "username": redditor.name,
            "created_utc": str(datetime.datetime.utcfromtimestamp(redditor.created_utc)),
            "link_karma": redditor.link_karma,
            "comment_karma": redditor.comment_karma,
            "is_employee": getattr(redditor, "is_employee", False),
            "verified": getattr(redditor, "verified", False),
            "has_verified_email": getattr(redditor, "has_verified_email", False)
        }

        # Data collectors
        scores = []
        comments = []
        subreddits = []
        flairs = []
        comment_activity = 0
        post_activity = 0
        interactions_with_others = 0

        for post in redditor.submissions.new(limit=3):  # Fetch recent 3 posts
            scores.append(post.score)
            comments.append(post.num_comments)
            subreddits.append(str(post.subreddit))
            if post.link_flair_text:
                flairs.append(post.link_flair_text)
            post_activity += 1

            # Fetch top-level comments only
            post.comment_sort = 'top'
            post.comments.replace_more(limit=0)

            for comment in post.comments.list():
                if comment.author and comment.author.name == redditor.name:
                    comment_activity += 1
                elif comment.author:
                    # Check replies to other's comments
                    for reply in getattr(comment, 'replies', []):
                        if isinstance(reply, MoreComments):
                            continue
                        if reply.author and reply.author.name == redditor.name:
                            interactions_with_others += 1

        # Calculate aggregates
        average_score = round(sum(scores) / len(scores), 2) if scores else 0
        average_comments = round(sum(comments) / len(comments), 2) if comments else 0
        subreddit_diversity = len(set(subreddits))
        post_engagement = sum([score + comment for score, comment in zip(scores, comments)])

        # Count repeated subreddits and flairs
        subreddit_counter = Counter(subreddits)
        flair_counter = Counter(flairs)

        common_subreddits = {
            sub: count for sub, count in subreddit_counter.items() if count > 1
        }

        common_flairs = {
            flair: count for flair, count in flair_counter.items() if count > 1
        }

        return {
            "user_info": user_info,
            "average_score": average_score,
            "average_comments": average_comments,
            "common_subreddits": common_subreddits,
            "common_flairs": common_flairs,
            "post_count_analyzed": post_activity,
            "post_engagement": post_engagement,
            "subreddit_diversity": subreddit_diversity,
            "comment_activity": comment_activity,
            "interactions_with_others": interactions_with_others
        }

    except Exception as e:
        return {"error": str(e)}
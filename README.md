# Cloud Image Gallery

A full-stack image gallery app built with **React**, **Node.js/Express**, and **AWS S3**.
Users can upload images from the browser, view them in a gallery, and delete them —
all stored in an S3 bucket.

## Tech Stack
- **Frontend:** React (Create React App), Axios
- **Backend:** Node.js, Express, Multer, AWS SDK v3
- **Cloud:** AWS S3 for object storage

## Project Structure
```
cloud-gallery/
  backend/     -> Express API (upload/list/delete via S3)
  frontend/    -> React app (upload form + gallery)
```

---

## Step 1: Create an AWS Account (free, ~10 mins)
1. Go to https://aws.amazon.com/free and click "Create a Free Account".
2. Sign up with your email — you'll need a credit/debit card for verification
   (AWS Free Tier won't charge you unless you exceed free limits, which this
   project won't).
3. Once your account is active, sign in to the **AWS Management Console**.

## Step 2: Create an S3 Bucket
1. In the AWS Console, search for **S3** and open it.
2. Click **Create bucket**.
3. Give it a globally unique name, e.g. `cloud-gallery-<yourname>-2026`.
4. Choose a region close to you (e.g. `ap-south-1` for Mumbai).
5. Under "Block Public Access settings", **uncheck** "Block all public access"
   (since this demo serves images publicly) and acknowledge the warning.
6. Click **Create bucket**.
7. Go to the bucket → **Permissions** tab → **Bucket Policy** → paste:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```
   Replace `YOUR-BUCKET-NAME` with your actual bucket name.

## Step 3: Create an IAM User (for programmatic access)
1. Search for **IAM** in the AWS Console.
2. Go to **Users** → **Create user**. Name it e.g. `cloud-gallery-app`.
3. Attach policy: **AmazonS3FullAccess** (fine for a demo project).
4. After creating the user, go to **Security credentials** → **Create access key**
   → choose "Application running outside AWS".
5. Copy the **Access Key ID** and **Secret Access Key** — you'll only see the
   secret once.

## Step 4: Configure and Run the Backend
```bash
cd backend
npm install
cp .env.example .env
```
Edit `.env` with your values:
```
PORT=5000
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=<your access key>
AWS_SECRET_ACCESS_KEY=<your secret key>
S3_BUCKET_NAME=<your bucket name>
```
Run it:
```bash
npm start
```
Test it's alive: open http://localhost:5000 — you should see a JSON status message.

## Step 5: Run the Frontend
```bash
cd frontend
npm install
npm start
```
This opens http://localhost:3000. Try uploading an image — it should appear in
the gallery, and you'll see it land in your S3 bucket under the `uploads/` folder.

---

## Step 6: Deploy (so you can share a live link)

**Fastest path for today's deadline:**
- **Backend:** Deploy to [Render](https://render.com) (free tier, ~5 min) —
  connect your GitHub repo, set the root directory to `backend`, add the same
  environment variables from `.env` in Render's dashboard, and deploy.
- **Frontend:** Deploy to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) —
  connect your repo, set root directory to `frontend`, add an environment
  variable `REACT_APP_API_URL` pointing to your deployed backend URL.

**If you specifically need an AWS deployment** (since the role asks for AWS
skills, the S3 usage already demonstrates that — but if you want compute too):
- **Backend on AWS Elastic Beanstalk:** `Elastic Beanstalk console → Create application → Node.js platform → upload backend as a zip`. Add environment variables in Beanstalk's configuration panel.
- **Frontend on S3 static website hosting:** Run `npm run build` in `frontend/`,
  create a second S3 bucket, enable "Static website hosting" in its properties,
  and upload the contents of the `build/` folder.

## Step 7: Push to GitHub
```bash
cd cloud-gallery
git init
git add .
git commit -m "Cloud Image Gallery - React, Node.js, AWS S3"
git branch -M main
git remote add origin https://github.com/<your-username>/cloud-gallery.git
git push -u origin main
```

**Important:** make sure `.env` is in `.gitignore` (already included below) so
you don't leak your AWS keys.

## What to say in the interview
Be ready to explain:
- Why you used S3 (durable, scalable object storage, decoupled from your server)
- How Multer handles the file upload in memory before streaming it to S3
- Why you're using AWS SDK v3's modular clients instead of the old v2 SDK
- What you'd add with more time: authentication, image resizing (e.g. with
  Lambda + Sharp), pagination, CloudFront CDN in front of S3

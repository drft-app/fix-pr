# GitHub Pull Request Bot

This application demonstrates how to build a GitHub App that automatically responds to pull requests using webhooks and GitHub's API. The bot comments on new pull requests with a customizable message using [octokit.js](https://github.com/octokit/octokit.js).

## Features

- Automatically responds to newly opened pull requests
- Uses GitHub App installation tokens for secure API access
- Customizable response message (stored in `message.md`)
- Supports both GitHub.com and GitHub Enterprise Server

## Requirements

- Node.js 20 or higher
- A GitHub App with the following configuration:
  - **Event subscriptions**: Pull Request
  - **Permissions**:
    - Pull requests: Read & write
    - Metadata: Read-only
- For local development:
  - A tunnel service to expose your local server (options include [smee.io](https://smee.io/), [ngrok](https://ngrok.com/), or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/local/))

## Setup Instructions

1. Clone this repository
2. Create a GitHub App in your GitHub account or organization
   - Configure the permissions and event subscriptions as listed above
   - Note your App ID and generate a private key
3. Copy `.env.sample` to `.env` and configure with your GitHub App credentials:
   ```
   APP_ID=your_app_id
   PRIVATE_KEY_PATH=path/to/your/private-key.pem
   WEBHOOK_SECRET=your_webhook_secret
   ```
   - For GitHub Enterprise Server, also add: `ENTERPRISE_HOSTNAME=your-github-enterprise-hostname`
4. Install dependencies:
   ```
   npm install
   ```
5. Start your tunnel service and note the public URL
6. Update your GitHub App's webhook URL to the tunnel URL
7. Start the server:
   ```
   npm run server
   ```
8. Install your GitHub App on a repository

## How It Works

1. When a pull request is opened in a repository where your app is installed, GitHub sends a webhook event to your server
2. The server validates the webhook payload using your secret
3. The app generates an installation token for the specific repository
4. Using this token, the app posts a comment on the pull request with the content from `message.md`

## Customization

- Edit `message.md` to change the comment that appears on pull requests
- Modify `app.js` to handle additional webhook events or add more functionality

## Security Best Practices

While this example reads the private key from a file path for simplicity, in production you should use a secure secrets management solution such as:

- [HashiCorp Vault](https://www.vaultproject.io/use-cases/key-management)
- [Azure Key Vault](https://learn.microsoft.com/en-us/azure/key-vault/secrets/quick-create-node?tabs=windows)
- [AWS Secrets Manager](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-secrets-manager/)
- [Google Secret Manager](https://cloud.google.com/nodejs/docs/reference/secret-manager/latest)

## Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines.

## License

This project is licensed under the terms specified in the [LICENSE](LICENSE) file.

import dotenv from 'dotenv'
import fs from 'fs'
import http from 'http'
import { Octokit, App } from 'octokit'
import { createNodeMiddleware } from '@octokit/webhooks'

/**
 * GitHub Pull Request Bot
 * 
 * This application automatically responds to new pull requests with a customizable message.
 * It uses GitHub App installation tokens for secure API access.
 */

// Load environment variables from .env file
dotenv.config()

// Configuration values
const appId = process.env.APP_ID
const privateKeyPath = process.env.PRIVATE_KEY_PATH
const privateKey = fs.readFileSync(privateKeyPath, 'utf8')
const secret = process.env.WEBHOOK_SECRET
const enterpriseHostname = process.env.ENTERPRISE_HOSTNAME
const port = process.env.PORT || 3000
const webhookPath = '/api/webhook'
const messageForNewPRs = fs.readFileSync('./message.md', 'utf8')

// Create an authenticated GitHub App instance
const app = new App({
  appId,
  privateKey,
  webhooks: {
    secret
  },
  ...(enterpriseHostname && {
    Octokit: Octokit.defaults({
      baseUrl: `https://${enterpriseHostname}/api/v3`
    })
  })
})

// Get & log the authenticated app's name
async function logAppInfo() {
  try {
    const { data } = await app.octokit.request('/app')
    app.octokit.log.info(`Authenticated as '${data.name}'`)
    return data.name
  } catch (error) {
    app.octokit.log.error(`Failed to get app info: ${error.message}`)
    return null
  }
}

// Handle new pull request events
app.webhooks.on('pull_request.opened', async ({ octokit, payload }) => {
  const prNumber = payload.pull_request.number
  const repoOwner = payload.repository.owner.login
  const repoName = payload.repository.name
  
  console.log(`Received a new pull request #${prNumber} in ${repoOwner}/${repoName}`)
  
  try {
    await octokit.rest.issues.createComment({
      owner: repoOwner,
      repo: repoName,
      issue_number: prNumber,
      body: messageForNewPRs
    })
    console.log(`Successfully commented on PR #${prNumber}`)
  } catch (error) {
    if (error.response) {
      console.error(`API Error! Status: ${error.response.status}. Message: ${error.response.data.message}`)
    } else {
      console.error(`Error commenting on PR: ${error.message}`)
    }
  }
})

// Error handling for webhook processing
app.webhooks.onError((error) => {
  if (error.name === 'AggregateError') {
    console.error(`Webhook processing error: ${error.event}`)
  } else {
    console.error(`Unexpected error: ${error.message}`)
  }
})

// Start the server
async function startServer() {
  // Log app info
  const appName = await logAppInfo()
  
  // Create and start the server
  const localWebhookUrl = `http://localhost:${port}${webhookPath}`
  const middleware = createNodeMiddleware(app.webhooks, { path: webhookPath })
  
  http.createServer(middleware).listen(port, () => {
    console.log(`🚀 ${appName || 'GitHub App'} server started!`)
    console.log(`🔔 Webhook URL: ${localWebhookUrl}`)
    console.log(`📝 PR message loaded (${messageForNewPRs.length} characters)`)
    console.log('Press Ctrl + C to quit.')
  })
}

// Initialize the application
startServer().catch(error => {
  console.error('Failed to start server:', error)
  process.exit(1)
})

# URL Monitoring Service

A serverless URL monitoring service built with Cloudflare Workers, TypeScript, Hono, and PostgreSQL.

## Features

- User authentication (register/login)
- Add, edit, and delete URLs to monitor
- Automatic URL status checking every 5 minutes
- View URL status history
- Secure token-based authentication
- Global deployment with Cloudflare Workers
- Serverless architecture with automatic scaling

## Prerequisites

- Node.js 18 or later
- Cloudflare account
- PostgreSQL database (Neon.tech recommended for serverless compatibility)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/shahnawaz-dev-23/monitoring-backend-service.git
cd url-monitoring-service
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in Cloudflare Dashboard:
   - Go to https://dash.cloudflare.com
   - Navigate to Workers & Pages
   - Find your worker "url-monitor-service"
   - Go to Settings > Variables
   - Add the following variables:
     ```
     DATABASE_URL=your_postgres_connection_string
     JWT_SECRET=your_jwt_secret
     ```

4. Set up the database:
```bash
npm run db:generate
npm run db:push
```

5. Deploy to Cloudflare Workers:
```bash
npm run deploy
```

Your application will be available at: https://url-monitor-service.your-subdomain.workers.dev

## API Access

You can access all the APIs of this application at:
```
https://url-monitor-service.bizgurukul-shahnawaz.workers.dev
```

## Development

### Local Development
Run the development server with Wrangler:
```bash
npm run dev
```
This will start a local development server that simulates the Cloudflare Workers environment.

### Database Management
- Generate database migrations:
```bash
npm run db:generate
```
- Push database changes:
```bash
npm run db:push
```

## API Endpoints

### Authentication

- `POST /auth/register` - Register a new user
  - Body: `{ "email": "user@example.com", "password": "password123" }`
  - Returns: `{ "token": "jwt_token" }`

- `POST /auth/login` - Login user
  - Body: `{ "email": "user@example.com", "password": "password123" }`
  - Returns: `{ "token": "jwt_token" }`

### URL Management

- `POST /api/urls` - Add a new URL to monitor
  - Body: `{ "url": "https://example.com", "name": "Example Site", "checkInterval": 300 }`
  - Headers: `Authorization: Bearer <token>`

- `GET /api/urls` - Get all monitored URLs for the authenticated user
  - Headers: `Authorization: Bearer <token>`

- `PUT /api/urls/:id` - Update a monitored URL
  - Body: `{ "url": "https://example.com", "name": "Updated Name", "checkInterval": 600 }`
  - Headers: `Authorization: Bearer <token>`

- `PATCH /api/urls/:id` - Partially update a monitored URL
  - Body: `{ "name": "Updated Name" }` or `{ "checkInterval": 600 }` or any combination of fields
  - Headers: `Authorization: Bearer <token>`

- `DELETE /api/urls/:id` - Delete a monitored URL
  - Headers: `Authorization: Bearer <token>`

- `GET /api/urls/:id/checks` - Get status history for a URL
  - Headers: `Authorization: Bearer <token>`

## Architecture

- **Frontend**: Cloudflare Workers (serverless)
- **Backend**: Cloudflare Workers (serverless)
- **Database**: PostgreSQL (Neon.tech)
- **Authentication**: JWT tokens
- **URL Monitoring**: Cloudflare Workers Cron Triggers (every 5 minutes)

## Security

- All passwords are hashed using bcrypt
- JWT tokens are used for authentication
- CORS is enabled for API access
- Input validation using Zod
- Rate limiting (configured in Cloudflare Workers)
- Environment variables managed through Cloudflare Dashboard
- SSL/TLS encryption (provided by Cloudflare)

## Monitoring

The service automatically checks all registered URLs every 5 minutes and stores the results in the database. You can view the status history for each URL through the API.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 
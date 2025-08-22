## ElevenLabs Knowledge Base API (Express)

Express API to manage ElevenLabs Knowledge Base documents: list, get, create, update, delete, and update-by-text.

### Prerequisites
- Node.js 18+
- ElevenLabs API key

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` in project root:
   ```bash
   cp .env.example .env
   # Open .env and set ELEVEN_API_KEY
   ```
3. Start server:
   ```bash
   npm run dev
   # or
   npm start
   ```

### Environment variables
- `PORT` (default: 3000)
- `ELEVEN_API_KEY` (required)
- `ELEVEN_API_BASE_URL` (default: `https://api.elevenlabs.io`)

### API Endpoints
- `GET /health` — service heartbeat
- `GET /api/knowledge-base` — list documents
  - Query params: `cursor`, `page_size` (1..100), `search`, `show_only_owned_documents`, `types[]` in {`file`,`url`,`text`}, `use_typesense`
- `GET /api/knowledge-base/:id` — get document by id
- `POST /api/knowledge-base` — create document (JSON)
  - body example for URL:
    ```json
    { "type": "url", "name": "Doc from URL", "url": "https://example.com/page" }
    ```
  - body example for Text:
    ```json
    { "type": "text", "name": "Doc from text", "text": "Some content" }
    ```
- `PUT /api/knowledge-base/:id` — update document metadata/content (JSON)
  - body example:
    ```json
    { "name": "New name" }
    ```
- `PUT /api/knowledge-base/:id/text` — update content using raw text (separate endpoint)
  - body example:
    ```json
    { "text": "Updated text content" }
    ```
- `DELETE /api/knowledge-base/:id` — delete document

### Notes
- Based on ElevenLabs docs for listing: [List knowledge base documents](https://elevenlabs.io/docs/api-reference/knowledge-base/list)
- For create/update/delete/get, paths follow the same `/v1/convai/knowledge-base` resource style.



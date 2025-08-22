/*
 * Service layer for interacting with ElevenLabs Knowledge Base API.
 *
 * Docs:
 * - List: https://elevenlabs.io/docs/api-reference/knowledge-base/list
 * - Other endpoints are inferred from API style; adjust paths if needed.
 */
const axios = require('axios');

const ELEVEN_API_BASE_URL = process.env.ELEVEN_API_BASE_URL || 'https://api.elevenlabs.io';
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY;

if (!ELEVEN_API_KEY) {
    // eslint-disable-next-line no-console
    console.warn('Warning: ELEVEN_API_KEY is not set. API calls will fail until it is configured.');
}

const http = axios.create({
    baseURL: ELEVEN_API_BASE_URL,
    headers: {
        'xi-api-key': ELEVEN_API_KEY,
        'Content-Type': 'application/json'
    },
    timeout: 30000
});

function toQueryString(params) {
    const searchParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        if (Array.isArray(value)) {
            value.forEach((v) => searchParams.append(key, v));
        } else {
            searchParams.set(key, String(value));
        }
    });
    const qs = searchParams.toString();
    return qs ? `?${qs}` : '';
}

exports.listDocuments = async (query) => {
    const qs = toQueryString(query);
    const { data } = await http.get(`/v1/convai/knowledge-base${qs}`);
    return data;
};

exports.getDocumentById = async (id) => {
    if (!id) throw new Error('Document id is required');
    const { data } = await http.get(`/v1/convai/knowledge-base/${id}`);
    return data;
};

exports.createDocument = async (payload) => {
    // payload: { type: 'file'|'url'|'text', name, url?, text?, metadata? }
    try {
        const { data } = await http.post('/v1/convai/knowledge-base/text', payload);
        return data;
    } catch (error) {
        if (error.response) {
            const err = new Error(`ElevenLabs API error (${error.response.status}): ${typeof error.response.data === 'string' ? error.response.data : JSON.stringify(error.response.data)}`);
            err.status = error.response.status;
            throw err;
        }
        throw error;
    }
};

exports.updateDocument = async (id, payload) => {
    if (!id) throw new Error('Document id is required');
    const { data } = await http.patch(`/v1/convai/knowledge-base/${id}`, payload);
    return data;
};

exports.updateDocumentByText = async (id, payload) => {
    if (!id) throw new Error('Document id is required');
    // Perform a partial update with text content. The API is expected to accept text updates on the document resource.
    const { data } = await http.patch(`/v1/convai/knowledge-base/${id}`, { type: 'text', ...payload });
    return data;
};

exports.deleteDocument = async (id) => {
    if (!id) throw new Error('Document id is required');
    await http.delete(`/v1/convai/knowledge-base/${id}`);
};



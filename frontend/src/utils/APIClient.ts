export class APIClient {
    private baseURL = '/api'
    private token: string | null = null

    setToken(token: string | null): void {
        this.token = token
    }

    private getHeaders(): HeadersInit {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`
        return headers
    }

    private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
        const res = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers: { ...this.getHeaders(), ...(options.headers || {}) }
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || res.statusText)
        return data
    }

    async login(credentials: any): Promise<any> {
        const result = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        })
        if (result.success && result.token) this.setToken(result.token)
        return result
    }

    async getProgress(): Promise<any> {
        return this.request('/progress')
    }

    async saveProgress(progress: any): Promise<any> {
        return this.request('/progress/save', {
            method: 'POST',
            body: JSON.stringify(progress)
        })
    }

    async loadProgress(): Promise<any> {
        return this.request('/progress/load')
    }
}

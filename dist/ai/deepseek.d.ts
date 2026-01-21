interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export declare function chatWithDeepSeek(messages: Message[], apiKey: string): Promise<string>;
export declare function createMarketAnalysisPrompt(market: any): Message[];
export declare function createComparisonPrompt(markets: any[]): Message[];
export declare function createChatPrompt(userMessage: string, marketContext?: any): Message[];
export {};

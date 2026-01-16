import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, FileText, Database, BarChart3, Settings, Sparkles } from 'lucide-react';
import {
    queryCopilot,
    QUICK_PROMPTS,
    THINKING_STEPS,
    type CopilotResponse,
    type SparklineData
} from '../engines/copilotEngine';

interface AICopilotModuleProps {
    onClose: () => void;
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    source?: string;
    sourceType?: 'log' | 'document' | 'analytics' | 'system';
    confidence?: number;
    actionTaken?: string;
    chartData?: SparklineData[];
    isTyping?: boolean;
}

interface ThinkingState {
    isThinking: boolean;
    currentStep: number;
}

// ============================================
// MINI SPARKLINE COMPONENT
// ============================================
const MiniSparkline: React.FC<{ data: SparklineData[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    return (
        <div className="copilot-sparkline">
            <div className="sparkline-bars">
                {data.map((point, idx) => (
                    <div key={idx} className="sparkline-bar-container">
                        <div
                            className="sparkline-bar"
                            style={{
                                height: `${((point.value - minValue) / range) * 100}%`
                            }}
                        />
                        {point.label && (
                            <span className="sparkline-label">{point.label}</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================
// SOURCE BADGE COMPONENT
// ============================================
const SourceBadge: React.FC<{
    source: string;
    sourceType: 'log' | 'document' | 'analytics' | 'system';
    confidence: number;
    actionTaken?: string;
}> = ({ source, sourceType, confidence, actionTaken }) => {
    const getIcon = () => {
        switch (sourceType) {
            case 'log': return <Database size={14} />;
            case 'document': return <FileText size={14} />;
            case 'analytics': return <BarChart3 size={14} />;
            default: return <Settings size={14} />;
        }
    };

    const getTypeLabel = () => {
        switch (sourceType) {
            case 'log': return 'Log Kaydı';
            case 'document': return 'Döküman';
            case 'analytics': return 'Analitik';
            default: return 'Sistem';
        }
    };

    if (sourceType === 'system') return null;

    return (
        <motion.div
            className="copilot-source-badge"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <div className="source-main">
                <span className="source-icon">{getIcon()}</span>
                <span className="source-type">{getTypeLabel()}</span>
                <span className="source-name">{source}</span>
            </div>
            <div className="source-meta">
                <span className={`confidence-score ${confidence >= 90 ? 'high' : confidence >= 70 ? 'medium' : 'low'}`}>
                    Güven: {confidence}%
                </span>
            </div>
            {actionTaken && (
                <div className="source-action">
                    <Sparkles size={12} />
                    <span>{actionTaken}</span>
                </div>
            )}
        </motion.div>
    );
};

// ============================================
// THINKING ANIMATION COMPONENT
// ============================================
const ThinkingAnimation: React.FC<{ currentStep: number }> = ({ currentStep }) => {
    return (
        <motion.div
            className="copilot-thinking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="thinking-avatar">
                <Bot size={20} />
            </div>
            <div className="thinking-content">
                {THINKING_STEPS.map((step, idx) => (
                    <motion.div
                        key={idx}
                        className={`thinking-step ${idx <= currentStep ? 'active' : ''} ${idx === currentStep ? 'current' : ''}`}
                        initial={{ opacity: 0.3 }}
                        animate={{
                            opacity: idx <= currentStep ? 1 : 0.3,
                            x: idx === currentStep ? [0, 2, 0] : 0
                        }}
                        transition={{
                            opacity: { duration: 0.2 },
                            x: { repeat: Infinity, duration: 0.5 }
                        }}
                    >
                        <span className="step-icon">{step.icon}</span>
                        <span className="step-text">{step.text}</span>
                        {idx === currentStep && (
                            <span className="step-dots">
                                <span></span><span></span><span></span>
                            </span>
                        )}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

// ============================================
// TYPEWRITER EFFECT HOOK
// ============================================
const useTypewriter = (text: string, speed: number = 15) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (!text) return;

        setDisplayedText('');
        setIsComplete(false);

        let index = 0;
        const interval = setInterval(() => {
            if (index < text.length) {
                setDisplayedText(text.slice(0, index + 1));
                index++;
            } else {
                setIsComplete(true);
                clearInterval(interval);
            }
        }, speed);

        return () => clearInterval(interval);
    }, [text, speed]);

    return { displayedText, isComplete };
};

// ============================================
// MESSAGE COMPONENT
// ============================================
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    const { displayedText, isComplete } = useTypewriter(
        message.role === 'assistant' && message.isTyping ? message.content : '',
        12
    );

    const content = message.role === 'assistant' && message.isTyping
        ? displayedText
        : message.content;

    // Enhanced markdown parsing with proper table support
    const parseMarkdown = (text: string) => {
        let parsed = text;

        // Convert **bold** to <strong>
        parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Convert | table | format | - proper table support
        if (parsed.includes('|') && parsed.includes('\n')) {
            const lines = parsed.split('\n');
            const tableLines: string[] = [];
            const resultLines: string[] = [];
            let inTable = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const isTableLine = line.startsWith('|') && line.endsWith('|');

                if (isTableLine) {
                    tableLines.push(line);
                    inTable = true;
                } else {
                    if (inTable && tableLines.length > 0) {
                        // Process accumulated table lines
                        let tableHtml = '<table class="md-table">';
                        let isFirstDataRow = true;

                        for (const tableLine of tableLines) {
                            const cells = tableLine.split('|').slice(1, -1); // Remove first/last empty
                            // Skip separator row (contains only dashes and colons)
                            if (cells.every(c => c.trim().match(/^[-:]+$/))) {
                                continue;
                            }
                            const cellTag = isFirstDataRow ? 'th' : 'td';
                            tableHtml += `<tr>${cells.map(c => `<${cellTag}>${c.trim()}</${cellTag}>`).join('')}</tr>`;
                            isFirstDataRow = false;
                        }

                        tableHtml += '</table>';
                        resultLines.push(tableHtml);
                        tableLines.length = 0;
                        inTable = false;
                    }
                    resultLines.push(lines[i]);
                }
            }

            // Handle table at end of text
            if (tableLines.length > 0) {
                let tableHtml = '<table class="md-table">';
                let isFirstDataRow = true;

                for (const tableLine of tableLines) {
                    const cells = tableLine.split('|').slice(1, -1);
                    if (cells.every(c => c.trim().match(/^[-:]+$/))) {
                        continue;
                    }
                    const cellTag = isFirstDataRow ? 'th' : 'td';
                    tableHtml += `<tr>${cells.map(c => `<${cellTag}>${c.trim()}</${cellTag}>`).join('')}</tr>`;
                    isFirstDataRow = false;
                }

                tableHtml += '</table>';
                resultLines.push(tableHtml);
            }

            parsed = resultLines.join('\n');
        }

        // Convert > quote to blockquote
        parsed = parsed.replace(/^>\s*(.*)$/gm, '<blockquote>$1</blockquote>');

        // Convert numbered lists - more careful approach
        const listPattern = /^(\d+)\.\s+(.*)$/gm;
        parsed = parsed.replace(listPattern, '<li>$2</li>');

        // Wrap consecutive list items in <ol>
        parsed = parsed.replace(/(<li>.*?<\/li>\s*)+/gs, (match) => {
            return '<ol>' + match.trim() + '</ol>';
        });

        // Convert bullet lists (- item)
        parsed = parsed.replace(/^-\s+(.*)$/gm, '<li class="bullet">$1</li>');

        // Wrap consecutive bullet items in <ul>
        parsed = parsed.replace(/(<li class="bullet">.*?<\/li>\s*)+/gs, (match) => {
            return '<ul>' + match.trim() + '</ul>';
        });

        // Convert line breaks (but not after block elements)
        parsed = parsed.replace(/\n(?!<)/g, '<br/>');
        parsed = parsed.replace(/<br\/><(table|ol|ul|blockquote)/g, '<$1');
        parsed = parsed.replace(/<\/(table|ol|ul|blockquote)><br\/>/g, '</$1>');

        return parsed;
    };

    return (
        <motion.div
            className={`copilot-message ${message.role}`}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2 }}
        >
            {message.role === 'assistant' && (
                <div className="message-avatar">
                    <Bot size={18} />
                </div>
            )}
            <div className="message-content-wrapper">
                <div
                    className="message-content"
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
                />

                {message.role === 'assistant' && message.chartData && isComplete && (
                    <MiniSparkline data={message.chartData} />
                )}

                {message.role === 'assistant' && message.source && isComplete && (
                    <SourceBadge
                        source={message.source}
                        sourceType={message.sourceType || 'system'}
                        confidence={message.confidence || 0}
                        actionTaken={message.actionTaken}
                    />
                )}
            </div>
        </motion.div>
    );
};

// ============================================
// MAIN COMPONENT
// ============================================
const AICopilotModule: React.FC<AICopilotModuleProps> = ({ onClose }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: `Merhaba! Ben **ACD Endüstriyel AI Copilot**'unuzum. 🤖

Fabrika verilerine, bakım loglarına ve operasyonel kılavuzlara erişimim var. Size şu konularda yardımcı olabilirim:

- Makine arızaları ve kök neden analizleri
- Üretim verimliliği (OEE) metrikleri
- Bakım maliyet tahminleri
- Operasyonel prosedürler

**Aşağıdaki hızlı sorulardan birini seçin** veya kendi sorunuzu yazın.`,
            source: 'System',
            sourceType: 'system',
            confidence: 100
        }
    ]);

    const [input, setInput] = useState('');
    const [thinking, setThinking] = useState<ThinkingState>({ isThinking: false, currentStep: 0 });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, thinking.isThinking]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim() || thinking.isThinking) return;

        const userMessage: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: text.trim()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');

        // Start thinking animation
        setThinking({ isThinking: true, currentStep: 0 });

        // Progress through thinking steps
        for (let i = 0; i < THINKING_STEPS.length; i++) {
            await new Promise(resolve => setTimeout(resolve, THINKING_STEPS[i].duration));
            setThinking(prev => ({ ...prev, currentStep: i }));
        }

        // Query the copilot engine
        const response: CopilotResponse = await queryCopilot(text);

        // End thinking
        setThinking({ isThinking: false, currentStep: 0 });

        // Add AI response with typing effect
        const aiMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: response.answer,
            source: response.source,
            sourceType: response.sourceType,
            confidence: response.confidence,
            actionTaken: response.actionTaken,
            chartData: response.chartData,
            isTyping: true
        };

        setMessages(prev => [...prev, aiMessage]);

        // After typing completes, update message
        setTimeout(() => {
            setMessages(prev =>
                prev.map(m =>
                    m.id === aiMessage.id ? { ...m, isTyping: false } : m
                )
            );
        }, response.answer.length * 12 + 500);

    }, [thinking.isThinking]);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const handleQuickPrompt = (text: string) => {
        sendMessage(text);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <motion.div
                className="modal-content copilot-module"
                onClick={e => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                {/* Header */}
                <div className="modal-header copilot-header">
                    <div className="header-left">
                        <div className="copilot-logo">
                            <Bot size={24} />
                            <div className="logo-pulse"></div>
                        </div>
                        <div>
                            <h2>AI Copilot</h2>
                            <p className="header-subtitle">Endüstriyel Karar Destek Asistanı</p>
                        </div>
                    </div>
                    <div className="header-right">
                        <div className="copilot-status">
                            <span className="status-dot online"></span>
                            <span>RAG Aktif</span>
                        </div>
                        <button onClick={onClose} className="close-btn">✕</button>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="copilot-chat-container">
                    <div className="copilot-messages">
                        {messages.map(message => (
                            <MessageBubble key={message.id} message={message} />
                        ))}

                        <AnimatePresence>
                            {thinking.isThinking && (
                                <ThinkingAnimation currentStep={thinking.currentStep} />
                            )}
                        </AnimatePresence>

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Prompts - Always visible for demo */}
                    {!thinking.isThinking && (
                        <motion.div
                            className="copilot-quick-prompts"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                            key={messages.length} // Re-animate when messages change
                        >
                            <span className="prompts-label">Hızlı Sorular:</span>
                            {QUICK_PROMPTS.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    className="quick-prompt-chip"
                                    onClick={() => handleQuickPrompt(prompt.text)}
                                >
                                    <span className="chip-label">{prompt.label}</span>
                                </button>
                            ))}
                        </motion.div>
                    )}

                    {/* Input Area */}
                    <div className="copilot-input-area">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Sorunuzu yazın... (örn: CNC-02 neden durdu?)"
                            disabled={thinking.isThinking}
                            className="copilot-input"
                        />
                        <button
                            className="copilot-send-btn"
                            onClick={() => sendMessage(input)}
                            disabled={!input.trim() || thinking.isThinking}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>

                {/* Info Footer */}
                <div className="copilot-footer">
                    <span className="footer-note">
                        💡 RAG Simülasyonu: Yanıtlar fabrika logları, bakım kılavuzları ve sensör verilerine dayalıdır.
                    </span>
                </div>
            </motion.div>
        </div>
    );
};

export default AICopilotModule;

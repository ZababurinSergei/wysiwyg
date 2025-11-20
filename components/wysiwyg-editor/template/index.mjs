/**
 * Шаблоны для компонента WYSIWYG редактора
 * @module components/wysiwyg-editor/template
 * @version 2.0.0
 * @description HTML шаблоны для WYSIWYG редактора в стиле peers-manager
 */

/**
 * Основной шаблон компонента WYSIWYG редактора
 * @function defaultTemplate
 * @param {Object} params - Параметры рендеринга
 * @param {Object} params.state - Состояние компонента
 * @param {string} [params.state.value=''] - Текущее содержимое редактора
 * @param {number} [params.state.wordCount=0] - Количество слов
 * @param {number} [params.state.charCount=0] - Количество символов
 * @param {number} [params.state.paragraphCount=0] - Количество параграфов
 * @param {Array} [params.state.formats=[]] - Текущие форматы текста
 * @param {string} [params.state.id=''] - ID компонента
 * @returns {string} HTML строка
 */
export function defaultTemplate({ state = {} }) {
    const {
        wordCount = 0,
        charCount = 0,
        paragraphCount = 0,
        formats = [],
        id = ''
    } = state;

    return `
        <div class="wysiwyg-editor">
            <div class="card full-width">
                <div class="card-header">
                    <h3 class="card-title">
                        <span class="card-icon">📝</span>
                        WYSIWYG Editor
                    </h3>
                    <div class="action-bar">
                        <button class="btn btn-success export-html" title="Export as HTML">
                            <span>📄</span> Export HTML
                        </button>
                        <button class="btn btn-info export-text" title="Export as Text">
                            <span>📝</span> Export Text
                        </button>
                        <button class="btn btn-warning theme-toggle" title="Toggle Theme">
                            <span>🌓</span> Theme
                        </button>
                        <button class="btn btn-danger clear-editor" title="Clear Editor">
                            <span>🗑️</span> Clear
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <div class="editor-container"><div id="editor-${id}" class="quill-editor"></div></div>
                    <div class="stats-section">
                        <div class="stats-grid">
                            <div class="stat-item">
                                <div class="stat-value" id="wordCount">${wordCount}</div>
                                <div class="stat-label">Words</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value" id="charCount">${charCount}</div>
                                <div class="stat-label">Characters</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value" id="paragraphCount">${paragraphCount}</div>
                                <div class="stat-label">Paragraphs</div>
                            </div>
                        </div>
                        
                        <div class="format-info">
                            <strong>Current Format:</strong>
                            <div class="formats-display" id="formatsDisplay">
                                ${formats.length > 0 ? formats.join(', ') : 'Normal text'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Минималистичный шаблон редактора
 * @function minimalTemplate
 * @param {Object} params - Параметры рендеринга
 * @param {Object} params.state - Состояние компонента
 * @param {string} [params.state.id=''] - ID компонента
 * @returns {string} HTML строка
 */
export function minimalTemplate({ state = {} }) {
    const { id = '' } = state;

    return `
        <div class="wysiwyg-editor">
            <div class="card full-width">
                <div class="card-content">
                    <div class="editor-container">
                        <div id="editor-${id}" class="quill-editor"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Шаблон только с редактором (без тулбара и статистики)
 * @function editorOnlyTemplate
 * @param {Object} params - Параметры рендеринга
 * @param {Object} params.state - Состояние компонента
 * @param {string} [params.state.id=''] - ID компонента
 * @returns {string} HTML строка
 */
export function editorOnlyTemplate({ state = {} }) {
    const { id = '' } = state;

    return `<div class="wysiwyg-editor"><div class="editor-container"><div id="editor-${id}" class="quill-editor"></div></div></div>
    `;
}

/**
 * Шаблон для отображения только статистики
 * @function statsTemplate
 * @param {Object} params - Параметры рендеринга
 * @param {Object} params.state - Состояние компонента
 * @param {number} [params.state.wordCount=0] - Количество слов
 * @param {number} [params.state.charCount=0] - Количество символов
 * @param {number} [params.state.paragraphCount=0] - Количество параграфов
 * @param {Array} [params.state.formats=[]] - Текущие форматы текста
 * @returns {string} HTML строка
 */
export function statsTemplate({ state = {} }) {
    const {
        wordCount = 0,
        charCount = 0,
        paragraphCount = 0,
        formats = []
    } = state;

    return `
        <div class="stats-section">
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${wordCount}</div>
                    <div class="stat-label">Words</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${charCount}</div>
                    <div class="stat-label">Characters</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${paragraphCount}</div>
                    <div class="stat-label">Paragraphs</div>
                </div>
            </div>
            
            <div class="format-info">
                <strong>Current Format:</strong>
                <div class="formats-display">
                    ${formats.length > 0 ? formats.join(', ') : 'Normal text'}
                </div>
            </div>
        </div>
    `;
}

/**
 * Шаблон для тулбара редактора
 * @function toolbarTemplate
 * @param {Object} params - Параметры рендеринга
 * @param {Object} params.state - Состояние компонента
 * @param {string} [params.state.theme='light'] - Текущая тема
 * @returns {string} HTML строка
 */
export function toolbarTemplate({ state = {} }) {
    const { theme = 'light' } = state;

    return `
        <div class="card-header">
            <h3 class="card-title">
                <span class="card-icon">📝</span>
                WYSIWYG Editor
                <span class="theme-badge">${theme === 'light' ? '☀️' : '🌙'}</span>
            </h3>
            <div class="action-bar">
                <button class="btn btn-success export-html" title="Export as HTML">
                    <span>📄</span> Export HTML
                </button>
                <button class="btn btn-info export-text" title="Export as Text">
                    <span>📝</span> Export Text
                </button>
                <button class="btn btn-warning theme-toggle" title="Toggle Theme">
                    <span>🌓</span> Theme
                </button>
                <button class="btn btn-danger clear-editor" title="Clear Editor">
                    <span>🗑️</span> Clear
                </button>
            </div>
        </div>
    `;
}

/**
 * Шаблон для состояния загрузки
 * @function loadingTemplate
 * @param {Object} params - Параметры рендеринга
 * @param {Object} params.state - Состояние компонента
 * @param {string} [params.state.message='Loading editor...'] - Сообщение загрузки
 * @returns {string} HTML строка
 */
export function loadingTemplate({ state = {} }) {
    const { message = 'Loading editor...' } = state;

    return `
        <div class="wysiwyg-editor">
            <div class="card full-width">
                <div class="card-content">
                    <div class="loading-state">
                        <div class="loading-spinner"></div>
                        <p class="loading-text">${message}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Шаблон для состояния ошибки
 * @function errorTemplate
 * @param {Object} params - Параметры рендеринга
 * @param {Object} params.state - Состояние компонента
 * @param {string} [params.state.error='Unknown error'] - Сообщение об ошибке
 * @param {string} [params.state.solution='Please try refreshing the page'] - Решение проблемы
 * @returns {string} HTML строка
 */
export function errorTemplate({ state = {} }) {
    const {
        error = 'Unknown error',
        solution = 'Please try refreshing the page'
    } = state;

    return `
        <div class="wysiwyg-editor">
            <div class="card full-width">
                <div class="card-content">
                    <div class="error-state">
                        <div class="error-icon">❌</div>
                        <h4 class="error-title">Editor Error</h4>
                        <p class="error-message">${error}</p>
                        <p class="error-solution">${solution}</p>
                        <button class="btn btn-primary retry-button">
                            <span>🔄</span> Retry
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
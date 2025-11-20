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
 * @param {string} [params.state.theme='light'] - Текущая тема
 * @param {boolean} [params.state.readOnly=false] - Режим только для чтения
 * @returns {string} HTML строка
 */
export async function defaultTemplate({ state = {} }) {
    const {
        wordCount = 0,
        charCount = 0,
        paragraphCount = 0,
        formats = [],
        id = '',
        theme = 'light',
        readOnly = false
    } = state;

    return `
        <div class="wysiwyg-editor" data-theme="${theme}">
            <div class="card full-width">
                <div class="card-header">
                    <h3 class="card-title">
                        <span class="card-icon">📝</span>
                        WYSIWYG Editor
                        ${readOnly ? '<span class="read-only-badge">Только чтение</span>' : ''}
                    </h3>
                    <div class="action-bar">
                        <button class="btn btn-success export-html" title="Export as HTML" ${readOnly ? 'disabled' : ''}>
                            <span>📄</span> Export HTML
                        </button>
                        <button class="btn btn-info export-text" title="Export as Text" ${readOnly ? 'disabled' : ''}>
                            <span>📝</span> Export Text
                        </button>
                        <button class="btn btn-warning theme-toggle" title="Toggle Theme">
                            <span>${theme === 'light' ? '🌙' : '☀️'}</span> 
                            ${theme === 'light' ? 'Dark' : 'Light'} Mode
                        </button>
                        <button class="btn btn-danger clear-editor" title="Clear Editor" ${readOnly ? 'disabled' : ''}>
                            <span>🗑️</span> Clear
                        </button>
                    </div>
                </div>
                <div class="card-content">
                    <div class="editor-container">
                        <div id="editor-${id}" class="quill-editor"></div>
                    </div>
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
 * @param {string} [params.state.theme='light'] - Текущая тема
 * @returns {string} HTML строка
 */
export async function minimalTemplate({ state = {} }) {
    const { id = '', theme = 'light' } = state;

    return `
        <div class="wysiwyg-editor" data-theme="${theme}">
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
 * @param {string} [params.state.theme='light'] - Текущая тема
 * @returns {string} HTML строка
 */
export async function editorOnlyTemplate({ state = {} }) {
    const { id = '', theme = 'light' } = state;

    return `
        <div class="wysiwyg-editor" data-theme="${theme}">
            <div class="editor-container">
                <div id="editor-${id}" class="quill-editor"></div>
            </div>
        </div>
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
export async function statsTemplate({ state = {} }) {
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
 * @param {boolean} [params.state.readOnly=false] - Режим только для чтения
 * @returns {string} HTML строка
 */
export async function toolbarTemplate({ state = {} }) {
    const { theme = 'light', readOnly = false } = state;

    return `
        <div class="card-header">
            <h3 class="card-title">
                <span class="card-icon">📝</span>
                WYSIWYG Editor
                <span class="theme-badge">${theme === 'light' ? '☀️' : '🌙'}</span>
                ${readOnly ? '<span class="read-only-badge">Только чтение</span>' : ''}
            </h3>
            <div class="action-bar">
                <button class="btn btn-success export-html" title="Export as HTML" ${readOnly ? 'disabled' : ''}>
                    <span>📄</span> Export HTML
                </button>
                <button class="btn btn-info export-text" title="Export as Text" ${readOnly ? 'disabled' : ''}>
                    <span>📝</span> Export Text
                </button>
                <button class="btn btn-warning theme-toggle" title="Toggle Theme">
                    <span>${theme === 'light' ? '🌙' : '☀️'}</span> 
                    ${theme === 'light' ? 'Dark' : 'Light'} Mode
                </button>
                <button class="btn btn-danger clear-editor" title="Clear Editor" ${readOnly ? 'disabled' : ''}>
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
 * @param {string} [params.state.theme='light'] - Текущая тема
 * @returns {string} HTML строка
 */
export async function loadingTemplate({ state = {} }) {
    const {
        message = 'Loading editor...',
        theme = 'light'
    } = state;

    return `
        <div class="wysiwyg-editor" data-theme="${theme}">
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
 * @param {string} [params.state.theme='light'] - Текущая тема
 * @returns {string} HTML строка
 */
export async function errorTemplate({ state = {} }) {
    const {
        error = 'Unknown error',
        solution = 'Please try refreshing the page',
        theme = 'light'
    } = state;

    return `
        <div class="wysiwyg-editor" data-theme="${theme}">
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

/**
 * Шаблон для режима только чтения
 * @function readOnlyTemplate
 * @param {Object} params - Параметры рендеринга
 * @param {Object} params.state - Состояние компонента
 * @param {string} [params.state.id=''] - ID компонента
 * @param {string} [params.state.theme='light'] - Текущая тема
 * @param {string} [params.state.value=''] - Содержимое редактора
 * @returns {string} HTML строка
 */
export async function readOnlyTemplate({ state = {} }) {
    const {
        id = '',
        theme = 'light',
        value = ''
    } = state;

    return `
        <div class="wysiwyg-editor" data-theme="${theme}">
            <div class="card full-width">
                <div class="card-header">
                    <h3 class="card-title">
                        <span class="card-icon">📄</span>
                        WYSIWYG Viewer
                        <span class="read-only-badge">Только чтение</span>
                    </h3>
                </div>
                <div class="card-content">
                    <div class="editor-container read-only">
                        <div id="editor-${id}" class="quill-editor">${value}</div>
                    </div>
                    <div class="read-only-notice">
                        <span class="notice-icon">👁️</span>
                        Этот документ доступен только для просмотра
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Шаблон компактного редактора
 * @function compactTemplate
 * @param {Object} params - Параметры рендеринга
 * @param {Object} params.state - Состояние компонента
 * @param {string} [params.state.id=''] - ID компонента
 * @param {string} [params.state.theme='light'] - Текущая тема
 * @param {string} [params.state.placeholder='Start typing...'] - Подсказка
 * @returns {string} HTML строка
 */
export async function compactTemplate({ state = {} }) {
    const {
        id = '',
        theme = 'light',
        placeholder = 'Start typing...'
    } = state;

    return `
        <div class="wysiwyg-editor compact" data-theme="${theme}">
            <div class="card">
                <div class="card-content">
                    <div class="editor-container compact">
                        <div id="editor-${id}" class="quill-editor" data-placeholder="${placeholder}"></div>
                    </div>
                    <div class="compact-stats">
                        <span class="word-count" id="wordCount">0 words</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Шаблон редактора с расширенным тулбаром
 * @function advancedTemplate
 * @param {Object} params - Параметры рендеринга
 * @param {Object} params.state - Состояние компонента
 * @param {string} [params.state.id=''] - ID компонента
 * @param {string} [params.state.theme='light'] - Текущая тема
 * @param {boolean} [params.state.readOnly=false] - Режим только для чтения
 * @returns {string} HTML строка
 */
export async function advancedTemplate({ state = {} }) {
    const {
        id = '',
        theme = 'light',
        readOnly = false
    } = state;

    return `
        <div class="wysiwyg-editor advanced" data-theme="${theme}">
            <div class="card full-width">
                <div class="card-header">
                    <h3 class="card-title">
                        <span class="card-icon">✏️</span>
                        Advanced Editor
                        ${readOnly ? '<span class="read-only-badge">Только чтение</span>' : ''}
                    </h3>
                    <div class="advanced-toolbar">
                        <div class="toolbar-group">
                            <button class="btn btn-sm btn-format" data-format="bold" title="Bold" ${readOnly ? 'disabled' : ''}>
                                <strong>B</strong>
                            </button>
                            <button class="btn btn-sm btn-format" data-format="italic" title="Italic" ${readOnly ? 'disabled' : ''}>
                                <em>I</em>
                            </button>
                            <button class="btn btn-sm btn-format" data-format="underline" title="Underline" ${readOnly ? 'disabled' : ''}>
                                <u>U</u>
                            </button>
                        </div>
                        <div class="toolbar-group">
                            <button class="btn btn-sm insert-image" title="Insert Image" ${readOnly ? 'disabled' : ''}>
                                🖼️
                            </button>
                            <button class="btn btn-sm insert-link" title="Insert Link" ${readOnly ? 'disabled' : ''}>
                                🔗
                            </button>
                            <button class="btn btn-sm insert-table" title="Insert Table" ${readOnly ? 'disabled' : ''}>
                                📊
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-content">
                    <div class="editor-container">
                        <div id="editor-${id}" class="quill-editor"></div>
                    </div>
                    <div class="advanced-stats">
                        <div class="stats-grid">
                            <div class="stat-item">
                                <div class="stat-value" id="wordCount">0</div>
                                <div class="stat-label">Words</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value" id="charCount">0</div>
                                <div class="stat-label">Chars</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value" id="paragraphCount">0</div>
                                <div class="stat-label">Paragraphs</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value" id="readingTime">0</div>
                                <div class="stat-label">Min Read</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}
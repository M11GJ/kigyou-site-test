/**
 * 活動データを取得して表示するモジュール
 * 
 * データソース優先順位:
 * 1. 静的JSONファイル（data/activities.json）← GitHub Actionsで自動更新
 * 2. スプレッドシートAPI（フォールバック）
 */

const ActivityLoader = (function () {
    // ============================================
    // データソース設定
    // ============================================
    // 静的JSONファイルのパス（GitHub Actionsで自動更新）
    const STATIC_JSON_URL = 'data/activities.json';

    // フォールバック用：スプレッドシートAPI URL
    const FALLBACK_API_URL = 'https://script.google.com/macros/s/AKfycbwTgLX_4AYsiQwVuROAEEG0Y5bxrqsUYJJ8lpP7c6KO4c52oXesF5r66FmBKfA2GfUJNw/exec';

    // 表示設定
    const INITIAL_SHOW_COUNT = 5;

    // エラーコード定義（詳細はERROR_CODES.mdを参照）
    const ERROR_CODES = {
        CONFIG_NOT_SET: 'ERR-AL-001',
        NETWORK_ERROR: 'ERR-AL-002',
        EMPTY_DATA: 'ERR-AL-003',
        CONTAINER_NOT_FOUND: 'ERR-AL-004'
    };

    /**
     * 日付をフォーマットする (例: 2025.10.15)
     */
    function formatDate(dateValue) {
        if (!dateValue) return '';

        let date;
        if (typeof dateValue === 'string') {
            date = new Date(dateValue);
        } else if (dateValue instanceof Date) {
            date = dateValue;
        } else {
            return String(dateValue);
        }

        if (isNaN(date.getTime())) {
            return String(dateValue);
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}.${month}.${day}`;
    }

    /**
     * HTMLをエスケープしてXSS対策
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 活動アイテムのHTML要素を作成
     */
    function createActivityItem(activity, isHidden) {
        const item = document.createElement('div');
        item.className = 'activity-item' + (isHidden ? ' hidden-activity' : '');

        item.innerHTML = `
            <span class="activity-date">${escapeHtml(formatDate(activity.date))}</span>
            <div class="activity-content">
                <h4>${escapeHtml(activity.title)}</h4>
                <p>${escapeHtml(activity.content)}</p>
            </div>
        `;

        return item;
    }

    /**
     * ローディング表示を作成
     */
    function showLoading(container) {
        container.innerHTML = `
            <div class="activity-loading" style="text-align: center; padding: 3rem;">
                <p style="color: #888;">読み込み中...</p>
            </div>
        `;
    }

    /**
     * エラー表示を作成（エラーコード方式）
     * 詳細なエラー情報は開発者コンソールにのみ出力
     */
    function showError(container, errorCode, consoleMessage) {
        // ユーザー向けには汎用メッセージとエラーコードのみ表示
        container.innerHTML = `
            <div class="activity-error" style="text-align: center; padding: 3rem;">
                <p style="color: #888;">データを読み込めませんでした</p>
                <p style="color: #aaa; font-size: 0.85rem;">エラーコード: ${escapeHtml(errorCode)}</p>
            </div>
        `;
        // 詳細はコンソールに出力（開発者向け）
        if (consoleMessage) {
            console.error(`[${errorCode}] ${consoleMessage}`);
        }
    }

    /**
     * もっと見る/しまう機能を設定
     */
    function setupToggleButtons(container, items) {
        const loadMoreContainer = document.getElementById('load-more-container');
        const collapseContainer = document.getElementById('collapse-container');

        if (!loadMoreContainer || !collapseContainer) return;

        function toggleActivities(showAll) {
            items.forEach((item, index) => {
                if (index >= INITIAL_SHOW_COUNT) {
                    if (showAll) {
                        item.classList.remove('hidden-activity');
                    } else {
                        item.classList.add('hidden-activity');
                    }
                }
            });

            loadMoreContainer.style.display = showAll ? 'none' : 'block';
            collapseContainer.style.display = showAll ? 'block' : 'none';
        }

        // 件数に応じてボタン表示
        if (items.length > INITIAL_SHOW_COUNT) {
            toggleActivities(false);

            loadMoreContainer.addEventListener('click', function () {
                toggleActivities(true);
            });

            collapseContainer.addEventListener('click', function () {
                toggleActivities(false);
                loadMoreContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        } else {
            loadMoreContainer.style.display = 'none';
            collapseContainer.style.display = 'none';
        }
    }

    /**
     * 活動データを取得して表示
     * 優先順位: 1. 静的JSON 2. スプレッドシートAPI
     */
    async function loadActivities() {
        const container = document.querySelector('.activity-container');
        if (!container) {
            console.error(`[${ERROR_CODES.CONTAINER_NOT_FOUND}] .activity-container が見つかりません`);
            return;
        }

        // ボタンコンテナを保存
        const loadMoreContainer = document.getElementById('load-more-container');
        const collapseContainer = document.getElementById('collapse-container');

        // ローディング表示
        showLoading(container);

        let activities = null;

        // 1. まず静的JSONを試す（高速）
        try {
            const response = await fetch(STATIC_JSON_URL);
            if (response.ok) {
                activities = await response.json();
                console.log('静的JSONからデータを取得しました');
            }
        } catch (e) {
            console.warn('静的JSON取得失敗、フォールバックを試行します');
        }

        // 2. 静的JSONが空または失敗した場合、APIにフォールバック
        if (!activities || activities.length === 0) {
            try {
                const response = await fetch(FALLBACK_API_URL);
                if (response.ok) {
                    activities = await response.json();
                    console.log('スプレッドシートAPIからデータを取得しました');
                }
            } catch (e) {
                showError(container, ERROR_CODES.NETWORK_ERROR, `データ取得エラー: ${e.message}`);
                if (loadMoreContainer) container.appendChild(loadMoreContainer);
                if (collapseContainer) container.appendChild(collapseContainer);
                return;
            }
        }

        // データが取得できなかった場合
        if (!activities || activities.length === 0) {
            showError(container, ERROR_CODES.EMPTY_DATA, '取得したデータが空です');
            if (loadMoreContainer) container.appendChild(loadMoreContainer);
            if (collapseContainer) container.appendChild(collapseContainer);
            return;
        }

        // コンテナをクリア
        container.innerHTML = '';

        // 日付で降順ソート（新しい順）
        activities.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
        });

        // 活動アイテムを追加
        const itemElements = [];
        activities.forEach((activity, index) => {
            const isHidden = index >= INITIAL_SHOW_COUNT;
            const item = createActivityItem(activity, isHidden);
            container.appendChild(item);
            itemElements.push(item);
        });

        // ボタンコンテナを追加
        if (loadMoreContainer) container.appendChild(loadMoreContainer);
        if (collapseContainer) container.appendChild(collapseContainer);

        // もっと見る/しまう機能を設定
        setupToggleButtons(container, itemElements);
    }

    // DOMContentLoaded で自動実行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadActivities);
    } else {
        loadActivities();
    }

    // 公開API
    return {
        reload: loadActivities
    };
})();

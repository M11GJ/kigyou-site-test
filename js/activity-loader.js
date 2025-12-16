/**
 * 活動リストの「もっと見る」「しまう」機能
 * 
 * 注意: 活動データはGitHub Actionsによってactivity.htmlに直接埋め込まれます
 * このスクリプトは表示/非表示の切り替え機能のみを提供します
 */

const ActivityLoader = (function () {
    // 表示設定
    const INITIAL_SHOW_COUNT = 5;

    /**
     * もっと見る/しまう機能を設定
     */
    function setupToggleButtons() {
        const container = document.querySelector('.activity-container');
        const loadMoreContainer = document.getElementById('load-more-container');
        const collapseContainer = document.getElementById('collapse-container');
        const items = container ? container.querySelectorAll('.activity-item') : [];

        if (!loadMoreContainer || !collapseContainer || items.length === 0) return;

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

    // DOMContentLoaded で自動実行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupToggleButtons);
    } else {
        setupToggleButtons();
    }

    return {
        refresh: setupToggleButtons
    };
})();

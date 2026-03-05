    /* ══════════════════════════════════════════════════════════════
       YouTube 저장 모드 — 카테고리 CRUD, 영상 저장, 즐겨찾기, 멀티선택, 드래그
    ══════════════════════════════════════════════════════════════ */

    // ─── 4단계: 카테고리 CRUD ───

    // Firebase에서 YouTube 카테고리 목록 불러오기
    async function ytLoadCategories() {
      try {
        ytState.ytCategories = await fbGetList(FB_YT_CATS);
        ytState.ytCategories.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
        ytRenderCategories();
        if (ytState.ytCategories.length > 0) {
          if (!ytState.ytActiveCatId || !ytState.ytCategories.find(c => c.id === ytState.ytActiveCatId)) {
            ytSelectCategory(ytState.ytCategories[0].id);
          } else {
            ytSelectCategory(ytState.ytActiveCatId);
          }
        } else {
          ytState.ytActiveCatId = null;
          ytState.savedVideos = [];
          ytRenderSavedCards();
        }
      } catch (e) {
        toast('카테고리 로드 실패: ' + e.message, 'error');
      }
    }

    // 사이드바에 카테고리 목록 렌더링
    function ytRenderCategories() {
      const list = document.getElementById('ytCategoryList');
      if (!list) return;
      list.innerHTML = ytState.ytCategories.map(c => `
        <div class="yt-cat-item ${c.id === ytState.ytActiveCatId ? 'active' : ''}"
             onclick="ytSelectCategory('${c.id}')"
             oncontextmenu="ytShowCatCtxMenu(event, '${c.id}')">
          <div class="yt-cat-item-left">
            <div class="cat-dot" style="background:${c.color || '#6366f1'}"></div>
            <span class="cat-name">${escHtml(c.name)}</span>
          </div>
          <span class="yt-cat-count" id="ytCatCount-${c.id}">-</span>
        </div>
      `).join('');
      ytLoadCategoryCounts();
    }

    // 카테고리별 저장 영상 개수 집계
    async function ytLoadCategoryCounts() {
      try {
        const allVids = await fbGetList(FB_YT_VIDS);
        ytState.savedVideoIds.clear();
        allVids.forEach(v => ytState.savedVideoIds.add(v.video_id));
        for (const c of ytState.ytCategories) {
          const count = allVids.filter(v => v.category_id === c.id).length;
          const el = document.getElementById(`ytCatCount-${c.id}`);
          if (el) el.textContent = count;
        }
      } catch (e) {
        console.warn('YouTube 카테고리 개수 로드 실패:', e);
      }
    }

    // 카테고리 선택
    function ytSelectCategory(id) {
      ytState.ytActiveCatId = id;
      ytRenderCategories();
      ytCancelMultiSelect();
      ytLoadSavedVideos();
    }

    // 카테고리 생성/수정 모달
    function ytOpenCategoryModal(editId = null) {
      ytState.ytEditingCatId = editId;
      const title = document.getElementById('ytCatModalTitle');
      const saveBtn = document.getElementById('ytCatSaveBtn');
      if (editId) {
        const cat = ytState.ytCategories.find(c => c.id === editId);
        title.textContent = '카테고리 수정';
        saveBtn.textContent = '수정';
        document.getElementById('ytCatName').value = cat?.name || '';
        ytState.ytSelectedColor = cat?.color || '#6366f1';
      } else {
        title.textContent = '새 카테고리';
        saveBtn.textContent = '만들기';
        document.getElementById('ytCatName').value = '';
        ytState.ytSelectedColor = '#6366f1';
      }
      ytRenderColorOptions();
      openModal('ytCategoryModal');
    }

    // 색상 옵션 렌더링
    function ytRenderColorOptions() {
      const el = document.getElementById('ytColorOptions');
      if (!el) return;
      el.innerHTML = COLORS.map(c => `
        <div class="color-option ${c === ytState.ytSelectedColor ? 'selected' : ''}"
             style="background:${c}"
             onclick="ytState.ytSelectedColor='${c}'; ytRenderColorOptions()">
        </div>
      `).join('');
    }

    // 카테고리 저장
    async function ytSaveCategory() {
      const name = document.getElementById('ytCatName').value.trim();
      if (!name) { toast('카테고리 이름을 입력하세요', 'error'); return; }
      const catData = { name, color: ytState.ytSelectedColor };
      try {
        if (ytState.ytEditingCatId) {
          await fbUpdate(FB_YT_CATS, ytState.ytEditingCatId, catData);
        } else {
          const newId = genId();
          await fbSet(FB_YT_CATS, newId, { id: newId, ...catData, created_at: new Date().toISOString() });
        }
        toast(ytState.ytEditingCatId ? '카테고리가 수정되었습니다' : '카테고리가 생성되었습니다', 'success');
        closeModal('ytCategoryModal');
        await ytLoadCategories();
      } catch (e) {
        toast('저장 실패: ' + e.message, 'error');
      }
    }

    // 카테고리 우클릭 메뉴
    let ytCtxCatId = null;
    function ytShowCatCtxMenu(e, id) {
      e.preventDefault(); e.stopPropagation();
      ytCtxCatId = id;
      const menu = document.getElementById('ytCtxMenu');
      menu.style.left = e.clientX + 'px';
      menu.style.top = e.clientY + 'px';
      menu.classList.add('show');
    }
    function ytEditCategory() { if (ytCtxCatId) ytOpenCategoryModal(ytCtxCatId); }

    // 카테고리 삭제
    async function ytDeleteCategory() {
      if (!ytCtxCatId) return;
      const cat = ytState.ytCategories.find(c => c.id === ytCtxCatId);
      if (!confirm(`"${cat?.name}" 카테고리와 포함된 모든 영상이 삭제됩니다.\n계속하시겠습니까?`)) return;
      try {
        await fbDelete(FB_YT_CATS, ytCtxCatId);
        const allVids = await fbGetList(FB_YT_VIDS);
        const toDelete = allVids.filter(v => v.category_id === ytCtxCatId);
        for (const v of toDelete) { await fbDelete(FB_YT_VIDS, v.id); }
        toast('카테고리가 삭제되었습니다', 'success');
        if (ytState.ytActiveCatId === ytCtxCatId) ytState.ytActiveCatId = null;
        await ytLoadCategories();
      } catch (e) {
        toast('삭제 실패: ' + e.message, 'error');
      }
    }

    // ─── 5단계: 영상 저장 기능 ───

    // 저장 메뉴 — 검색 카드에서 📥 클릭 시 카테고리 선택
    function ytShowSaveMenu(e, videoData) {
      e.stopPropagation();
      const menu = document.getElementById('ytSaveMenu');
      if (!menu) return;
      let html = '';
      if (ytState.ytCategories.length > 0) {
        html = ytState.ytCategories.map(c => `
          <button class="yt-save-menu-item" onclick="ytSaveVideoToCategory('${c.id}', window._ytSaveTemp); document.getElementById('ytSaveMenu').style.display='none';">
            <div class="cat-dot" style="background:${c.color || '#6366f1'}; width:8px; height:8px; border-radius:50%;"></div>
            ${escHtml(c.name)}
          </button>
        `).join('');
      }
      html += `<button class="yt-save-menu-item yt-save-menu-new" onclick="document.getElementById('ytSaveMenu').style.display='none'; ytOpenCategoryModal();">+ 새 카테고리 만들기</button>`;
      menu.innerHTML = html;
      const rect = e.currentTarget.getBoundingClientRect();
      menu.style.left = Math.min(rect.left, window.innerWidth - 220) + 'px';
      menu.style.top = (rect.bottom + 4) + 'px';
      menu.style.display = 'block';
      window._ytSaveTemp = videoData;
    }

    // 영상을 카테고리에 저장
    async function ytSaveVideoToCategory(catId, videoData) {
      if (!videoData || !catId) return;
      const videoId = ytExtractVideoId(videoData.sourceUrl);
      try {
        const allVids = await fbGetList(FB_YT_VIDS);
        const dup = allVids.find(v => v.category_id === catId && v.video_id === videoId);
        if (dup) { toast('이미 이 카테고리에 저장된 영상입니다', 'error'); return; }
      } catch (e) { /* 중복 체크 실패해도 저장 시도 */ }

      const dbId = genId();
      const data = {
        id: dbId, category_id: catId, video_id: videoId,
        title: videoData.title || '', channel: videoData.channel || '',
        thumbUrl: videoData.thumbUrl || videoData.maxThumbUrl || '',
        sourceUrl: videoData.sourceUrl || '', duration: videoData.duration || '',
        viewsRaw: videoData.viewsRaw || '', date: videoData.date || '',
        isShorts: videoData.isShorts || false, favorite: false,
        created_at: new Date().toISOString()
      };
      try {
        await fbSet(FB_YT_VIDS, dbId, data);
        ytState.savedVideoIds.add(videoId);
        toast('영상이 저장되었습니다', 'success');
        ytLoadCategoryCounts();
        document.querySelectorAll(`.yt-save-btn[data-vid="${videoId}"]`).forEach(btn => {
          btn.classList.add('saved');
          btn.textContent = '✓';
        });
      } catch (e) {
        toast('저장 실패: ' + e.message, 'error');
      }
    }

    // 카테고리별 저장 영상 로드
    async function ytLoadSavedVideos() {
      if (!ytState.ytActiveCatId) { ytState.savedVideos = []; ytRenderSavedCards(); return; }
      try {
        const allVids = await fbGetList(FB_YT_VIDS);
        let catVids = allVids.filter(v => v.category_id === ytState.ytActiveCatId);
        if (ytState.savedFilter === 'favorites') catVids = catVids.filter(v => v.favorite);
        if (ytState.savedSort === 'newest') catVids.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
        else if (ytState.savedSort === 'oldest') catVids.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));
        else if (ytState.savedSort === 'name') catVids.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        else if (ytState.savedSort === 'favorites') catVids.sort((a, b) => {
          if (b.favorite !== a.favorite) return b.favorite ? 1 : -1;
          return (b.created_at || '').localeCompare(a.created_at || '');
        });
        ytState.savedVideos = catVids;
        ytRenderSavedCards();
      } catch (e) {
        toast('영상 로드 실패: ' + e.message, 'error');
      }
    }

    // 저장 모드 카드 렌더링
    function ytRenderSavedCards() {
      const grid = document.getElementById('ytGrid');
      const emptyEl = document.getElementById('ytSavedEmpty');
      const searchEmpty = document.getElementById('ytEmpty');
      if (!grid) return;
      grid.innerHTML = '';
      grid.classList.remove('yt-grid--shorts');
      if (searchEmpty) searchEmpty.style.display = 'none';
      if (ytState.savedVideos.length === 0) { if (emptyEl) emptyEl.style.display = ''; return; }
      if (emptyEl) emptyEl.style.display = 'none';

      ytState.savedVideos.forEach(v => {
        const card = document.createElement('div');
        card.className = 'yt-card' + (v.isShorts ? ' yt-card--shorts' : '') + (ytState.ytSelectedIds.has(v.id) ? ' selected' : '');
        card.setAttribute('data-vid', v.id);
        card.onclick = (e) => ytHandleCardClick(v.id, v, e);
        card.innerHTML = `
          <div class="yt-thumb">
            <img alt="${escHtml(v.title)}" loading="lazy">
            <div class="yt-play-btn"></div>
            ${v.isShorts ? '<span class="yt-shorts-badge">SHORTS</span>' : ''}
            ${v.duration ? `<span class="yt-duration">${escHtml(v.duration)}</span>` : ''}
            <div class="yt-check" onclick="event.stopPropagation(); ytToggleSelect('${v.id}', event)">${ytState.ytSelectedIds.has(v.id) ? '✓' : ''}</div>
            <button class="yt-star-btn ${v.favorite ? 'active' : ''}" onclick="event.stopPropagation(); ytToggleFavorite('${v.id}')">${v.favorite ? '★' : '☆'}</button>
          </div>
          <div class="yt-info">
            <div class="yt-title">${escHtml(v.title)}</div>
            <div class="yt-channel">${escHtml(v.channel || '')}${v.date ? ' · ' + escHtml(v.date) : ''}</div>
            ${v.viewsRaw ? `<div class="yt-views">조회수 ${escHtml(v.viewsRaw)}</div>` : ''}
          </div>
        `;
        grid.appendChild(card);
        const img = card.querySelector('img');
        const candidates = [];
        const vid = v.video_id || ytExtractVideoId(v.sourceUrl);
        if (vid) candidates.push(`https://i.ytimg.com/vi/${vid}/hqdefault.jpg`);
        if (v.thumbUrl) candidates.push(v.thumbUrl);
        ytLoadThumb(img, candidates);
      });
    }

    // ─── 6단계: 즐겨찾기 ───

    async function ytToggleFavorite(dbId) {
      const vid = ytState.savedVideos.find(v => v.id === dbId);
      if (!vid) return;
      const newVal = !vid.favorite;
      try {
        await fbUpdate(FB_YT_VIDS, dbId, { favorite: newVal });
        vid.favorite = newVal;
        if (ytState.savedFilter === 'favorites') { ytLoadSavedVideos(); }
        else {
          const card = document.querySelector(`.yt-card[data-vid="${dbId}"]`);
          if (card) {
            const btn = card.querySelector('.yt-star-btn');
            if (btn) { btn.textContent = newVal ? '★' : '☆'; btn.classList.toggle('active', newVal); }
          }
        }
      } catch (e) { toast('즐겨찾기 변경 실패', 'error'); }
    }

    // ─── 7단계: 멀티선택 + 벌크 액션 ───

    function ytToggleMultiSelect() {
      ytState.ytMultiMode = !ytState.ytMultiMode;
      ytState.ytSelectedIds.clear();
      document.getElementById('ytMultiSelectBtn')?.classList.toggle('btn-primary', ytState.ytMultiMode);
      ytUpdateBulkBar();
      ytRenderSavedCards();
    }

    function ytSelectAllVideos() {
      const allSel = ytState.savedVideos.every(v => ytState.ytSelectedIds.has(v.id));
      if (allSel) ytState.savedVideos.forEach(v => ytState.ytSelectedIds.delete(v.id));
      else ytState.savedVideos.forEach(v => ytState.ytSelectedIds.add(v.id));
      ytUpdateBulkBar();
      ytRenderSavedCards();
    }

    function ytCancelMultiSelect() {
      ytState.ytMultiMode = false;
      ytState.ytSelectedIds.clear();
      document.getElementById('ytMultiSelectBtn')?.classList.remove('btn-primary');
      ytUpdateBulkBar();
      if (ytState.viewMode === 'saved') ytRenderSavedCards();
    }

    function ytToggleSelect(id, e) {
      if (e) e.stopPropagation();
      if (!ytState.ytMultiMode) return;
      if (ytState.ytSelectedIds.has(id)) ytState.ytSelectedIds.delete(id);
      else ytState.ytSelectedIds.add(id);
      ytUpdateBulkBar();
      const card = document.querySelector(`.yt-card[data-vid="${id}"]`);
      if (card) {
        card.classList.toggle('selected', ytState.ytSelectedIds.has(id));
        const check = card.querySelector('.yt-check');
        if (check) check.textContent = ytState.ytSelectedIds.has(id) ? '✓' : '';
      }
    }

    function ytUpdateBulkBar() {
      const bar = document.getElementById('ytBulkBar');
      const count = document.getElementById('ytBulkCount');
      if (ytState.ytMultiMode && ytState.ytSelectedIds.size > 0) {
        bar.classList.add('show');
        count.textContent = ytState.ytSelectedIds.size + '개';
      } else { bar.classList.remove('show'); }
    }

    async function ytBulkDelete() {
      if (ytState.ytSelectedIds.size === 0) return;
      if (!confirm(`${ytState.ytSelectedIds.size}개 영상을 삭제하시겠습니까?`)) return;
      try {
        const ids = Array.from(ytState.ytSelectedIds);
        for (const id of ids) await fbDelete(FB_YT_VIDS, id);
        toast(`${ids.length}개 영상이 삭제되었습니다`, 'success');
        ytCancelMultiSelect();
        await ytLoadSavedVideos();
        await ytLoadCategoryCounts();
      } catch (e) { toast('삭제 실패: ' + e.message, 'error'); }
    }

    function ytBulkMove() {
      if (ytState.ytSelectedIds.size === 0) return;
      const body = document.getElementById('ytMoveBody');
      if (!body) return;
      const otherCats = ytState.ytCategories.filter(c => c.id !== ytState.ytActiveCatId);
      if (otherCats.length === 0) {
        body.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">이동할 수 있는 카테고리가 없습니다.</p>';
      } else {
        body.innerHTML = otherCats.map(c => `
          <div style="padding:10px 12px; cursor:pointer; border-radius:6px; display:flex; align-items:center; gap:8px; margin-bottom:4px;"
               onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background=''"
               onclick="ytExecuteBulkMove('${c.id}')">
            <div class="cat-dot" style="background:${c.color}"></div>
            <span style="font-size:14px;">${escHtml(c.name)}</span>
          </div>
        `).join('');
      }
      openModal('ytMoveModal');
    }

    async function ytExecuteBulkMove(targetCatId) {
      try {
        const ids = Array.from(ytState.ytSelectedIds);
        for (const id of ids) await fbUpdate(FB_YT_VIDS, id, { category_id: targetCatId });
        toast(`${ids.length}개 영상이 이동되었습니다`, 'success');
        closeModal('ytMoveModal');
        ytCancelMultiSelect();
        await ytLoadSavedVideos();
        await ytLoadCategoryCounts();
      } catch (e) { toast('이동 실패: ' + e.message, 'error'); }
    }

    function ytHandleCardClick(dbId, videoData, e) {
      if (ytState.ytMultiMode) { ytToggleSelect(dbId, e); }
      else { ytOpenPlayer(videoData); }
    }

    // ─── 8단계: 드래그 선택 ───

    document.addEventListener('mousedown', function(e) {
      if (ytState.viewMode !== 'saved') return;
      const grid = document.getElementById('ytGrid');
      if (!grid || grid.style.display === 'none') return;
      if (!grid.contains(e.target)) return;
      if (e.target.closest('.yt-card') || e.target.closest('button') || e.target.closest('input')) return;
      if (e.button !== 0) return;
      ytState.ytDragSel.active = true;
      ytState.ytDragSel.startX = e.clientX;
      ytState.ytDragSel.startY = e.clientY;
      if (!ytState.ytMultiMode) {
        ytState.ytMultiMode = true;
        document.getElementById('ytMultiSelectBtn')?.classList.add('btn-primary');
      }
      if (!e.shiftKey) ytState.ytSelectedIds.clear();
      const box = document.getElementById('dragSelectBox');
      if (box) {
        box.style.left = e.clientX + 'px'; box.style.top = e.clientY + 'px';
        box.style.width = '0px'; box.style.height = '0px'; box.style.display = 'block';
      }
      e.preventDefault();
    });

    document.addEventListener('mousemove', function(e) {
      if (!ytState.ytDragSel.active) return;
      const box = document.getElementById('dragSelectBox');
      if (!box) return;
      const x = Math.min(e.clientX, ytState.ytDragSel.startX);
      const y = Math.min(e.clientY, ytState.ytDragSel.startY);
      const w = Math.abs(e.clientX - ytState.ytDragSel.startX);
      const h = Math.abs(e.clientY - ytState.ytDragSel.startY);
      box.style.left = x + 'px'; box.style.top = y + 'px';
      box.style.width = w + 'px'; box.style.height = h + 'px';
      const selRect = { left: x, top: y, right: x + w, bottom: y + h };
      document.querySelectorAll('#ytGrid .yt-card[data-vid]').forEach(card => {
        const cr = card.getBoundingClientRect();
        const overlap = !(cr.right < selRect.left || cr.left > selRect.right || cr.bottom < selRect.top || cr.top > selRect.bottom);
        const id = card.getAttribute('data-vid');
        if (overlap) { ytState.ytSelectedIds.add(id); card.classList.add('selected'); const ck = card.querySelector('.yt-check'); if (ck) ck.textContent = '✓'; }
        else if (!e.shiftKey) { ytState.ytSelectedIds.delete(id); card.classList.remove('selected'); const ck = card.querySelector('.yt-check'); if (ck) ck.textContent = ''; }
      });
      ytUpdateBulkBar();
    });

    document.addEventListener('mouseup', function() {
      if (!ytState.ytDragSel.active) return;
      ytState.ytDragSel.active = false;
      const box = document.getElementById('dragSelectBox');
      if (box) box.style.display = 'none';
      if (ytState.ytSelectedIds.size === 0) {
        ytState.ytMultiMode = false;
        document.getElementById('ytMultiSelectBtn')?.classList.remove('btn-primary');
        ytUpdateBulkBar();
      }
    });

    // ─── 9단계: 뷰 모드 전환 ───

    function ytSwitchViewMode(mode) {
      ytState.viewMode = mode;
      const sidebar = document.getElementById('ytSidebar');
      const headerSearch = document.getElementById('ytHeaderSearch');
      const headerSaved = document.getElementById('ytHeaderSaved');
      const sortBar = document.getElementById('ytSortBar');
      const emptyEl = document.getElementById('ytEmpty');
      const savedEmpty = document.getElementById('ytSavedEmpty');
      const grid = document.getElementById('ytGrid');

      if (mode === 'saved') {
        if (sidebar) sidebar.style.display = 'flex';
        if (headerSearch) headerSearch.style.display = 'none';
        if (headerSaved) headerSaved.style.display = 'flex';
        if (sortBar) sortBar.style.display = 'none';
        if (emptyEl) emptyEl.style.display = 'none';
        if (grid) grid.innerHTML = '';
        ytLoadCategories();
      } else {
        if (sidebar) sidebar.style.display = 'none';
        if (headerSearch) headerSearch.style.display = '';
        if (headerSaved) headerSaved.style.display = 'none';
        if (savedEmpty) savedEmpty.style.display = 'none';
        ytCancelMultiSelect();
        if (grid) grid.innerHTML = '';
        if (ytState.results.length > 0) ytRenderCards(ytState.results);
        else if (emptyEl) emptyEl.style.display = '';
      }
    }

    function ytSetSavedFilter(f) {
      ytState.savedFilter = f;
      document.querySelectorAll('#ytHeaderSaved .filter-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.filter === f);
      });
      ytLoadSavedVideos();
    }

    function ytSetSavedSort(s) {
      ytState.savedSort = s;
      ytLoadSavedVideos();
    }

    // ─── 10단계: UX 마무리 ───

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const saveMenu = document.getElementById('ytSaveMenu');
        if (saveMenu && saveMenu.style.display !== 'none') { saveMenu.style.display = 'none'; return; }
        if (ytState.ytMultiMode) { ytCancelMultiSelect(); return; }
      }
    });

    document.addEventListener('click', function(e) {
      const saveMenu = document.getElementById('ytSaveMenu');
      if (saveMenu && saveMenu.style.display !== 'none' && !saveMenu.contains(e.target) && !e.target.closest('.yt-save-btn')) saveMenu.style.display = 'none';
      const ytCtx = document.getElementById('ytCtxMenu');
      if (ytCtx && ytCtx.classList.contains('show') && !ytCtx.contains(e.target)) ytCtx.classList.remove('show');
    });


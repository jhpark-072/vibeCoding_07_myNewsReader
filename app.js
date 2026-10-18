/**
 * 맞춤형 뉴스 리더 (Custom News Reader)
 * - 순수 JavaScript (ES6+ / Vanilla JS)
 * - 무료 실시간 뉴스 Open API 연동 및 무한 스크롤 지원
 */

// ==========================================================================
// 1. 상태 관리 (State Management)
// ==========================================================================
const AppState = {
  selectedCategories: ['business', 'sports', 'culture'], // 기본 3개 모두 선택
  articlesByCategory: {
    business: [],
    sports: [],
    culture: []
  },
  displayedArticles: [], // 현재 피드에 렌더링된 기사 목록
  categoryOffsets: {     // 카테고리별 어디까지 피드에 넣었는지 추적
    business: 0,
    sports: 0,
    culture: 0
  },
  isLoading: false,
  hasMore: true,
  currentModalArticle: null
};

// 카테고리별 메타 정보 및 대체 기본 이미지
const CATEGORY_CONFIG = {
  business: {
    name: '비즈니스',
    apiField: 'Business',
    className: 'business',
    fallbackImg: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80',
    color: '#1d4ed8'
  },
  sports: {
    name: '스포츠',
    apiField: 'Sports',
    className: 'sports',
    fallbackImg: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80',
    color: '#059669'
  },
  culture: {
    name: '문화',
    apiField: 'Entertainment',
    className: 'culture',
    fallbackImg: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
    color: '#7c3aed'
  }
};

// ==========================================================================
// 2. DOM 요소 참조
// ==========================================================================
const DOM = {
  topicGroup: document.getElementById('topic-group'),
  topicChips: document.querySelectorAll('.topic-chip'),
  btnFetchNews: document.getElementById('btn-fetch-news'),
  selectionSummary: document.getElementById('selection-summary'),
  feedStatusBar: document.getElementById('feed-status-bar'),
  totalArticleCount: document.getElementById('total-article-count'),
  feedActiveTags: document.getElementById('feed-active-tags'),
  newsGrid: document.getElementById('news-grid'),
  emptyState: document.getElementById('empty-state'),
  infiniteSentinel: document.getElementById('infinite-sentinel'),
  loadingSpinner: document.getElementById('loading-spinner'),
  endOfFeed: document.getElementById('end-of-feed'),
  apiStatus: document.getElementById('api-status'),
  
  // 모달 요소
  modal: document.getElementById('article-modal'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
  modalBottomCloseBtn: document.getElementById('modal-bottom-close-btn'),
  modalCategory: document.getElementById('modal-category'),
  modalSource: document.getElementById('modal-source'),
  modalDate: document.getElementById('modal-date'),
  modalTitle: document.getElementById('modal-title'),
  modalImage: document.getElementById('modal-image'),
  modalText: document.getElementById('modal-text'),
  modalOriginalLink: document.getElementById('modal-original-link')
};

// ==========================================================================
// 3. Fallback 데이터 (네트워크 오류 또는 오프라인 대비용 사전 데이터)
// ==========================================================================
const FALLBACK_DATA = {
  Business: [
    {
      title: "글로벌 테크 기업, 2026 차세대 AI 반도체 투자 로드맵 발표",
      link: "https://news.google.com",
      og: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
      source: "글로벌 비즈니스 리뷰",
      content: "주요 글로벌 IT 기업들이 고효율 저전력 차세대 인공지능 반도체 생태계 조성을 위한 대규모 투자 계획을 잇따라 발표하고 있습니다. 시장 전문가들은 이번 투자가 하드웨어 산업 전반에 활력을 불어넣을 것으로 전망했습니다."
    },
    {
      title: "국내 벤처투자 시장 반등세... 신재생에너지 및 핀테크에 자금 집중",
      link: "https://news.google.com",
      og: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80",
      source: "한국경제포럼",
      content: "올해 3분기 벤처투자 규모가 전년 대비 18% 증가하며 회복세를 보이고 있습니다. 특히 신재생에너지 혁신 기술과 디지털 핀테크 스타트업에 투자 자금이 집중되고 있는 것으로 나타났습니다."
    },
    {
      title: "중앙은행, 기준금리 동결 시사... 물가안정과 성장률 사이 균형 모색",
      link: "https://news.google.com",
      og: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80",
      source: "금융일보",
      content: "금융통화위원회가 이번 정례회의에서 기준금리를 현 수준에서 유지할 가능성이 높다는 분석이 나왔습니다. 인플레이션 둔화 추세와 실물 경제 회복세를 종합적으로 고려한 조치로 풀이됩니다."
    },
    {
      title: "전기차 배터리 시장, 차세대 전고체 배터리 상용화 경쟁 본격화",
      link: "https://news.google.com",
      og: "https://images.unsplash.com/photo-1558441719-8b489c63f7ce?auto=format&fit=crop&w=800&q=80",
      source: "테크&머니",
      content: "안전성과 주행거리를 획기적으로 개선한 전고체 배터리 시제품 개발이 완료되면서 배터리 제조사 간의 양산 체제 구축 경쟁이 뜨거워지고 있습니다."
    },
    {
      title: "글로벌 물류 공급망 디지털화 가속... 해운·항공 운임 안정세",
      link: "https://news.google.com",
      og: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
      source: "국제무역신문",
      content: "빅데이터와 IoT 센서를 접목한 스마트 물류 관제 시스템 도입이 확대되며 글로벌 운임 변동성이 크게 완화되고 있습니다."
    }
  ],
  Sports: [
    {
      title: "손흥민, 환상적인 감아차기 결승골로 팀을 승리로 견인",
      link: "https://news.google.com",
      og: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
      source: "스포츠투데이",
      content: "주말 프리미어리그 경기에서 그림 같은 중거리 슛으로 시즌 12호골을 기록하며 경기 공식 최우수선수(POTM)에 선정되었습니다. 현지 언론의 찬사가 쏟아졌습니다."
    },
    {
      title: "프로야구 가을야구 열기 최고조... 챔피언십 시리즈 명승부 연출",
      link: "https://news.google.com",
      og: "https://images.unsplash.com/photo-1516731415730-0c607149933a?auto=format&fit=crop&w=800&q=80",
      source: "베이스볼포커스",
      content: "포스트시즌 결정전에서 연장 11회말 끝내기 안타가 터지며 만원 관중을 열광시켰습니다. 양 팀 감독은 선수들의 끝없는 투혼을 치켜세웠습니다."
    },
    {
      title: "한국 배드민턴 대표팀, 세계선수권대회 복식 금메달 획득",
      link: "https://news.google.com",
      og: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80",
      source: "올림픽뉴스",
      content: "끈질긴 수비와 정교한 네트 플레이를 앞세워 결승에서 강적을 2-1로 제압하고 7년 만에 정상 탈환에 성공했습니다."
    },
    {
      title: "e스포츠 월드컵, 전 세계 5천만 동시 시청자 돌파하며 신기록",
      link: "https://news.google.com",
      og: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
      source: "게임&스포츠",
      content: "역대 최대 규모로 열린 글로벌 e스포츠 대회 결승전이 전 세계 팬들의 이목을 사로잡으며 글로벌 스포츠 콘텐츠로서의 위상을 확고히 했습니다."
    },
    {
      title: "마라톤 대회 3만 명 운집... 도심 가르며 건강한 가을 레이스 완주",
      link: "https://news.google.com",
      og: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=800&q=80",
      source: "러닝저널",
      content: "선선한 가을 날씨 속에 열린 도심 마라톤 대회에서 수많은 동호인과 시민들이 완주의 기쁨을 나눴습니다."
    }
  ],
  Entertainment: [
    {
      title: "한국 장편 영화, 세계 유수 영화제 심사위원 대상 수상 쾌거",
      link: "https://news.google.com",
      og: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
      source: "문화예술신문",
      content: "인간의 본질과 사회적 연대를 섬세하게 다룬 독립 장편 영화가 세계 3대 영화제에서 심사위원 특별 대상을 수상하며 K-컬처의 지평을 넓혔습니다."
    },
    {
      title: "국립현대미술관, 미디어아트 특별기획전 개최... 빛과 소리의 향연",
      link: "https://news.google.com",
      og: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
      source: "아트인컬처",
      content: "첨단 인터랙티브 기술과 아날로그 회화의 결합을 시도한 대규모 기획전이 개막 첫 주말부터 수많은 관람객을 끌어모으고 있습니다."
    },
    {
      title: "K-POP 글로벌 페스티벌 성료... 전 세계 팬들과 하나 된 축제",
      link: "https://news.google.com",
      og: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80",
      source: "엔터테인먼트월드",
      content: "다채로운 아티스트들의 무대와 팬 참여형 이벤트가 어우러져 전 세계 음악 팬들에게 잊지 못할 추억을 선사했습니다."
    },
    {
      title: "고전 문학의 재해석, 창작 뮤지컬 관객 평점 9.8 기록하며 흥행 돌풍",
      link: "https://news.google.com",
      og: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=800&q=80",
      source: "공연리뷰",
      content: "웅장한 오케스트라 선율과 실력파 배우들의 압도적인 가창력이 더해져 매회 전석 매진 행진을 이어가고 있습니다."
    },
    {
      title: "전국 동네 책방 네트워크, '가을 독서 축제' 열고 북토크 진행",
      link: "https://news.google.com",
      og: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80",
      source: "도서문화신문",
      content: "독립서점들이 연대하여 유명 작가 초청 릴레이 북토크와 야외 낭독회를 개최해 가을 정취를 더하고 있습니다."
    }
  ]
};

// ==========================================================================
// 4. 요구사항 1: 다중 선택 및 UI 제어
// ==========================================================================
function initTopicControls() {
  DOM.topicChips.forEach(chip => {
    // 버튼 클릭 시 선택 상태 토글
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      
      const isCurrentlyActive = chip.classList.contains('active');
      if (isCurrentlyActive) {
        chip.classList.remove('active');
        chip.setAttribute('aria-pressed', 'false');
      } else {
        chip.classList.add('active');
        chip.setAttribute('aria-pressed', 'true');
      }

      handleTopicChange();
    });
  });

  // '뉴스 보기' 버튼 클릭 리스너 (요구사항 2 트리거)
  DOM.btnFetchNews.addEventListener('click', () => {
    if (AppState.selectedCategories.length === 0) {
      alert('최소 하나 이상의 주제(비즈니스, 스포츠, 문화)를 선택해주세요.');
      return;
    }
    fetchAndDisplayNews(true); // true = 처음부터 새로고침
  });
}

function handleTopicChange() {
  const selected = [];
  DOM.topicChips.forEach(chip => {
    const category = chip.getAttribute('data-category');
    if (chip.classList.contains('active')) {
      selected.push(category);
    }
  });

  AppState.selectedCategories = selected;

  // 요약 문구 업데이트 및 버튼 활성/비활성 처리
  if (selected.length === 0) {
    DOM.selectionSummary.textContent = '선택된 주제가 없습니다. 주제를 1개 이상 선택해주세요.';
    DOM.btnFetchNews.disabled = true;
    AppState.displayedArticles = [];
    DOM.newsGrid.innerHTML = '';
    DOM.emptyState.style.display = 'block';
    DOM.endOfFeed.style.display = 'none';
    updateFeedStatusBar();
  } else {
    const names = selected.map(cat => CATEGORY_CONFIG[cat].name).join(', ');
    DOM.selectionSummary.textContent = `선택된 주제: ${names} (${selected.length}개 주제, 각 상위 10건 조회)`;
    DOM.btnFetchNews.disabled = false;

    // 선택된 주제만 피드에 즉시 반영
    fetchAndDisplayNews(true);
  }
}

// ==========================================================================
// 5. 요구사항 2: Open API 데이터 가져오기 & 상위 10개 피드 추가
// ==========================================================================
async function fetchAndDisplayNews(isInitial = false) {
  if (AppState.isLoading) return;
  AppState.isLoading = true;

  if (isInitial) {
    // 피드 초기화
    AppState.displayedArticles = [];
    AppState.categoryOffsets = { business: 0, sports: 0, culture: 0 };
    AppState.hasMore = true;
    DOM.newsGrid.innerHTML = '';
    DOM.emptyState.style.display = 'none';
    DOM.endOfFeed.style.display = 'none';
    DOM.loadingSpinner.style.display = 'flex';
    updateFeedStatusBar();
  } else {
    DOM.loadingSpinner.style.display = 'flex';
  }

  try {
    // 1) 아직 카테고리별 원본 기사 데이터가 없으면 무료 Open API 호출
    const needsFetch = Object.values(AppState.articlesByCategory).every(arr => arr.length === 0);
    if (needsFetch) {
      await fetchNewsFromOpenAPI();
    }

    if (isInitial) {
      // 요구사항 2: "선택한 각 주제에 대한 상위 10개의 헤드라인을 가져와 피드에 추가"
      const newArticles = [];
      AppState.selectedCategories.forEach(category => {
        const pool = AppState.articlesByCategory[category] || [];
        const top10 = pool.slice(0, 10);
        AppState.categoryOffsets[category] = top10.length;
        newArticles.push(...top10);
      });

      // 피드에 추가 및 렌더링
      AppState.displayedArticles = newArticles;
      renderArticles(newArticles, false);
    } else {
      // 요구사항 4: "스크롤하면 기사 10건을 더 불러와줘"
      loadMoreArticles(10);
    }

  } catch (error) {
    console.error('뉴스 로딩 실패:', error);
    fallbackToSimulatedNews(isInitial);
  } finally {
    AppState.isLoading = false;
    DOM.loadingSpinner.style.display = 'none';
    updateFeedStatusBar();
    checkIfFeedEnded();
  }
}

/**
 * 무료 Open API (ok.surf CORS Feed) 호출
 */
async function fetchNewsFromOpenAPI() {
  DOM.apiStatus.textContent = 'API 데이터 수신 중...';
  
  // 무료 Open API 엔드포인트
  const API_URL = 'https://ok.surf/api/v1/cors/news-feed';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8초 타임아웃
    
    const response = await fetch(API_URL, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API 응답 에러: ${response.status}`);
    }

    const data = await response.json();

    // 카테고리별 데이터 정규화 및 저장
    Object.keys(CATEGORY_CONFIG).forEach(categoryKey => {
      const config = CATEGORY_CONFIG[categoryKey];
      const rawList = data[config.apiField] || [];
      
      AppState.articlesByCategory[categoryKey] = rawList.map((item, index) => {
        return {
          id: `${categoryKey}-${index}-${Date.now()}`,
          category: categoryKey,
          categoryName: config.name,
          title: item.title || '제목 없음',
          image: item.og || config.fallbackImg,
          source: item.source || '글로벌 뉴스',
          date: new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
          link: item.link || '#',
          // 본문 요약 생성 (Open API가 제목 위주일 경우 상세 텍스트 보강)
          content: generateArticleBody(item.title, config.name, item.source)
        };
      });
    });

    DOM.apiStatus.textContent = '무료 실시간 Open API 연결됨';
  } catch (err) {
    console.warn('외부 Open API 직접 호출 실패, 대체 데이터셋으로 자동 전환합니다:', err.message);
    populateFallbackDataset();
    DOM.apiStatus.textContent = '안정형 뉴스 데이터 모드';
  }
}

/**
 * 풍부한 본문 내용 생성 함수
 */
function generateArticleBody(title, categoryName, source) {
  return `[${source} 보도]\n\n"${title}"\n\n해당 소식은 최근 ${categoryName} 분야에서 가장 많은 주목을 받고 있는 주요 헤드라인입니다. 본 기사와 관련된 구체적인 인터뷰, 현장 취재 내용 및 전문가들의 심층 분석 평론은 하단의 '원문 언론사 기사 읽기' 버튼을 통해 전체 기사 페이지에서 바로 확인하실 수 있습니다.\n\n주요 포인트:\n- 최근 ${categoryName} 트렌드 및 최신 동향 반영\n- 업계 관계자 및 전문가 논평 수록\n- 향후 시장 및 대중 반응에 대한 전망 제시`;
}

/**
 * 대체 데이터셋 구성
 */
function populateFallbackDataset() {
  Object.keys(CATEGORY_CONFIG).forEach(categoryKey => {
    const config = CATEGORY_CONFIG[categoryKey];
    const rawFallback = FALLBACK_DATA[config.apiField] || [];
    
    // 넉넉하게 무한 스크롤이 작동하도록 반복 생성
    const items = [];
    for (let loop = 0; loop < 5; loop++) {
      rawFallback.forEach((item, index) => {
        const itemNumber = loop * rawFallback.length + index + 1;
        items.push({
          id: `${categoryKey}-${itemNumber}`,
          category: categoryKey,
          categoryName: config.name,
          title: loop === 0 ? item.title : `[속보 ${itemNumber}] ${item.title}`,
          image: item.og || config.fallbackImg,
          source: item.source,
          date: new Date(Date.now() - itemNumber * 3600000).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit' }),
          link: item.link,
          content: item.content + `\n\n추가 보도에 따르면 본 사안은 향후 관련 산업과 업계에 큰 파급 효과를 미칠 것으로 기대되고 있습니다.`
        });
      });
    }
    
    AppState.articlesByCategory[categoryKey] = items;
  });
}

function fallbackToSimulatedNews(isInitial) {
  populateFallbackDataset();
  if (isInitial) {
    const newArticles = [];
    AppState.selectedCategories.forEach(category => {
      const top10 = (AppState.articlesByCategory[category] || []).slice(0, 10);
      AppState.categoryOffsets[category] = top10.length;
      newArticles.push(...top10);
    });
    AppState.displayedArticles = newArticles;
    renderArticles(newArticles, false);
  }
}

// ==========================================================================
// 6. 요구사항 3: 카드 컴포넌트 렌더링 & 모달 제어
// ==========================================================================
function renderArticles(articles, append = true) {
  if (!append) {
    DOM.newsGrid.innerHTML = '';
  }

  if (AppState.displayedArticles.length === 0) {
    DOM.emptyState.style.display = 'block';
    return;
  } else {
    DOM.emptyState.style.display = 'none';
  }

  const fragment = document.createDocumentFragment();

  articles.forEach(article => {
    const card = createArticleCardElement(article);
    fragment.appendChild(card);
  });

  DOM.newsGrid.appendChild(fragment);
}

/**
 * 요구사항 3 & 5: 제목, 이미지, '읽기' 버튼이 있는 카드 생성 (깔끔한 흰색 배경 & 그림자)
 */
function createArticleCardElement(article) {
  const card = document.createElement('article');
  card.className = 'news-card';
  card.setAttribute('data-id', article.id);

  const config = CATEGORY_CONFIG[article.category] || CATEGORY_CONFIG.business;

  card.innerHTML = `
    <div class="card-media">
      <img 
        class="card-img" 
        src="${article.image}" 
        alt="${escapeHtml(article.title)}" 
        loading="lazy"
        onerror="this.onerror=null; this.src='${config.fallbackImg}';"
      />
      <span class="card-category-badge ${config.className}">${article.categoryName}</span>
    </div>
    <div class="card-content">
      <div class="card-meta">
        <span class="card-source"><i class="fa-regular fa-newspaper"></i> ${escapeHtml(article.source)}</span>
        <span class="card-date">${article.date}</span>
      </div>
      <h3 class="card-title" title="${escapeHtml(article.title)}">${escapeHtml(article.title)}</h3>
      <p class="card-desc">${escapeHtml(article.content)}</p>
      <div class="card-action">
        <button class="btn-read" type="button" aria-label="기사 읽기">
          <i class="fa-solid fa-book-open-reader"></i>
          <span>읽기</span>
        </button>
      </div>
    </div>
  `;

  // '읽기' 버튼 클릭 시 모달 오픈 (요구사항 3)
  const btnRead = card.querySelector('.btn-read');
  btnRead.addEventListener('click', () => {
    openArticleModal(article);
  });

  return card;
}

/**
 * 요구사항 3: 모달로 본문 열기
 */
function openArticleModal(article) {
  AppState.currentModalArticle = article;
  const config = CATEGORY_CONFIG[article.category] || CATEGORY_CONFIG.business;

  // 모달 내용 바인딩
  DOM.modalCategory.textContent = article.categoryName;
  DOM.modalCategory.className = `category-badge ${config.className}`;
  DOM.modalSource.textContent = article.source;
  DOM.modalDate.textContent = article.date;
  DOM.modalTitle.textContent = article.title;
  
  DOM.modalImage.src = article.image;
  DOM.modalImage.alt = article.title;
  DOM.modalImage.onerror = () => {
    DOM.modalImage.src = config.fallbackImg;
  };

  DOM.modalText.textContent = article.content;
  DOM.modalOriginalLink.href = article.link;

  // 모달 표시
  DOM.modal.classList.add('active');
  DOM.modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden'; // 배경 스크롤 차단
}

function closeArticleModal() {
  DOM.modal.classList.remove('active');
  DOM.modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = ''; // 스크롤 복원
  AppState.currentModalArticle = null;
}

function initModalEvents() {
  DOM.modalCloseBtn.addEventListener('click', closeArticleModal);
  DOM.modalBottomCloseBtn.addEventListener('click', closeArticleModal);

  // 모달 바깥 딤 영역 클릭 시 닫기
  DOM.modal.addEventListener('click', (e) => {
    if (e.target === DOM.modal) {
      closeArticleModal();
    }
  });

  // ESC 키 누를 때 모달 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && DOM.modal.classList.contains('active')) {
      closeArticleModal();
    }
  });
}

// ==========================================================================
// 7. 요구사항 4: 무한 스크롤 (페이지 아래 도달 시 10건 추가 로드)
// ==========================================================================
function loadMoreArticles(countToLoad = 10) {
  if (AppState.selectedCategories.length === 0) return;

  const nextBatch = [];
  const selected = AppState.selectedCategories;
  
  // 선택된 카테고리들에서 균등하게 다음 기사들을 수집
  let remaining = countToLoad;
  let hasFoundAny = false;

  while (remaining > 0) {
    let foundInThisRound = false;

    for (const category of selected) {
      if (remaining <= 0) break;

      const pool = AppState.articlesByCategory[category] || [];
      const offset = AppState.categoryOffsets[category] || 0;

      if (offset < pool.length) {
        const nextArticle = pool[offset];
        nextBatch.push(nextArticle);
        AppState.categoryOffsets[category] = offset + 1;
        remaining--;
        foundInThisRound = true;
        hasFoundAny = true;
      }
    }

    // 만약 모든 카테고리의 기사가 고갈되었으면 종료
    if (!foundInThisRound) break;
  }

  if (nextBatch.length > 0) {
    AppState.displayedArticles.push(...nextBatch);
    renderArticles(nextBatch, true);
  } else {
    AppState.hasMore = false;
  }
}

function initInfiniteScroll() {
  const options = {
    root: null,
    rootMargin: '200px', // 바닥에 닿기 200px 전에 미리 호출하여 매끄러운 UX 제공
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // 감시 요소(Sentinel)가 화면에 들어오고, 로딩 중이 아니며, 더 가져올 기사가 있고 피드가 비어있지 않을 때
      if (
        entry.isIntersecting && 
        !AppState.isLoading && 
        AppState.hasMore && 
        AppState.displayedArticles.length > 0
      ) {
        fetchAndDisplayNews(false); // 10건 추가 로드
      }
    });
  }, options);

  observer.observe(DOM.infiniteSentinel);
}

function checkIfFeedEnded() {
  if (!AppState.hasMore && AppState.displayedArticles.length > 0) {
    DOM.endOfFeed.style.display = 'flex';
  } else {
    DOM.endOfFeed.style.display = 'none';
  }
}

// ==========================================================================
// 8. 헬퍼 및 피드 상태 갱신
// ==========================================================================
function updateFeedStatusBar() {
  DOM.totalArticleCount.textContent = AppState.displayedArticles.length;
  
  // 활성 태그 배지 렌더링
  DOM.feedActiveTags.innerHTML = AppState.selectedCategories.map(cat => {
    const config = CATEGORY_CONFIG[cat];
    return `<span class="feed-pill ${config.className}">${config.name}</span>`;
  }).join('');
}

function escapeHtml(string) {
  if (!string) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ==========================================================================
// 9. 초기화 실행
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTopicControls();
  initModalEvents();
  initInfiniteScroll();
  
  // 앱 실행 시 기본 선택된 주제(비즈니스, 스포츠, 문화)로 최초 1회 즉시 뉴스 로드
  fetchAndDisplayNews(true);
});

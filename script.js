// Структура данных
let collections = []
let currentCollection = null
let currentCardIndex = 0
let shuffledCardIndices = []

// DOM элементы
const collectionsView = document.getElementById('collections-view')
const collectionModal = document.getElementById('collection-modal')
const editCollectionView = document.getElementById('edit-collection-view')
const cardModal = document.getElementById('card-modal')
const learningView = document.getElementById('learning-view')
const themeToggle = document.getElementById('theme-toggle')

// Инициализация приложения
function init() {
	loadFromLocalStorage()
	loadThemePreference()
	renderCollections()
	attachEventListeners()
}

// Специальная функция для закрытия модального окна карточки
function closeCardModal() {
	// Явно скрываем модальное окно
	const cardModal = document.getElementById('card-modal')
	cardModal.classList.add('hidden')

	// Показываем представление редактирования коллекции
	editCollectionView.classList.remove('hidden')

	console.log('Модальное окно карточки закрыто')
}

// Функции для работы с localStorage
function loadFromLocalStorage() {
	const storedCollections = localStorage.getItem('flashcards-collections')
	if (storedCollections) {
		collections = JSON.parse(storedCollections)
	}
}

function saveToLocalStorage() {
	localStorage.setItem('flashcards-collections', JSON.stringify(collections))
}

// Функции для работы с темой приложения
function loadThemePreference() {
	const storedTheme = localStorage.getItem('flashcards-theme')
	if (storedTheme) {
		document.body.className = storedTheme
		updateThemeToggleIcon(storedTheme)
	} else if (
		window.matchMedia &&
		window.matchMedia('(prefers-color-scheme: dark)').matches
	) {
		// Используем предпочтения системы, если пользователь еще не выбрал тему
		document.body.className = 'dark-theme'
		updateThemeToggleIcon('dark-theme')
	}
}

function toggleTheme() {
	const currentTheme = document.body.className
	const newTheme = currentTheme === 'dark-theme' ? 'light-theme' : 'dark-theme'

	document.body.className = newTheme
	localStorage.setItem('flashcards-theme', newTheme)

	updateThemeToggleIcon(newTheme)
}

function updateThemeToggleIcon(theme) {
	const icon = themeToggle.querySelector('i')
	const text = themeToggle.querySelector('.theme-text')

	if (theme === 'dark-theme') {
		icon.className = 'fas fa-sun'
		text.textContent = 'Светлая тема'
	} else {
		icon.className = 'fas fa-moon'
		text.textContent = 'Тёмная тема'
	}
}

// Функции для работы с подборками
function createCollection(name) {
	const collection = {
		id: Date.now().toString(),
		name: name,
		cards: [],
	}

	collections.push(collection)
	saveToLocalStorage()
	return collection
}

function updateCollection(id, name) {
	const collection = collections.find(c => c.id === id)
	if (collection) {
		collection.name = name
		saveToLocalStorage()
	}
}

function deleteCollection(id) {
	collections = collections.filter(c => c.id !== id)
	saveToLocalStorage()
}

// Функции для работы с карточками
function createCard(collectionId, title, content) {
	const collection = collections.find(c => c.id === collectionId)
	if (collection) {
		const card = {
			id: Date.now().toString(),
			title: title,
			content: content,
		}

		collection.cards.push(card)
		saveToLocalStorage()
		return card
	}
	return null
}

function updateCard(collectionId, cardId, title, content) {
	const collection = collections.find(c => c.id === collectionId)
	if (collection) {
		const card = collection.cards.find(c => c.id === cardId)
		if (card) {
			card.title = title
			card.content = content
			saveToLocalStorage()
		}
	}
}

function deleteCard(collectionId, cardId) {
	const collection = collections.find(c => c.id === collectionId)
	if (collection) {
		collection.cards = collection.cards.filter(c => c.id !== cardId)
		saveToLocalStorage()
	}
}

// Функции экспорта/импорта
function exportCollection(collectionId) {
	const collection = collections.find(c => c.id === collectionId)
	if (!collection) return

	const dataStr = JSON.stringify(collection, null, 2)
	const dataUri =
		'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

	const exportFileName = `${collection.name.replace(/\s+/g, '_')}_${new Date()
		.toISOString()
		.slice(0, 10)}.json`

	const linkElement = document.createElement('a')
	linkElement.setAttribute('href', dataUri)
	linkElement.setAttribute('download', exportFileName)
	linkElement.style.display = 'none'
	document.body.appendChild(linkElement)
	linkElement.click()
	document.body.removeChild(linkElement)
}

function importCollection(fileContent) {
	try {
		const collection = JSON.parse(fileContent)

		// Базовая валидация импортируемого файла
		if (
			!collection.name ||
			!collection.cards ||
			!Array.isArray(collection.cards)
		) {
			throw new Error('Неверный формат файла')
		}

		// Генерируем новый ID для коллекции чтобы избежать конфликтов
		collection.id = Date.now().toString()

		// Генерируем новые ID для карточек
		collection.cards = collection.cards.map(card => {
			return {
				...card,
				id: Date.now().toString() + Math.random().toString().slice(2, 8),
			}
		})

		collections.push(collection)
		saveToLocalStorage()
		renderCollections()

		alert(
			`Подборка "${collection.name}" с ${collection.cards.length} карточками успешно импортирована.`
		)
	} catch (e) {
		alert('Ошибка импорта файла: ' + e.message)
	}
}

// Функции отображения
function renderCollections() {
	const collectionList = document.getElementById('collection-list')
	collectionList.innerHTML = ''

	if (collections.length === 0) {
		collectionList.innerHTML =
			'<p>Пока нет подборок. Создайте свою первую подборку, чтобы начать.</p>'
		return
	}

	collections.forEach(collection => {
		const collectionCard = document.createElement('div')
		collectionCard.className = 'collection-card'
		collectionCard.innerHTML = `
            <h3>${collection.name}</h3>
            <p>${collection.cards.length} карточек</p>
            <div class="collection-actions">
                <button class="secondary edit-collection" data-id="${collection.id}">
                    <i class="fas fa-edit"></i> Редактировать
                </button>
                <button class="warning delete-collection" data-id="${collection.id}">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </div>
        `

		collectionCard.addEventListener('click', e => {
			if (!e.target.closest('button')) {
				openCollection(collection.id)
			}
		})

		collectionList.appendChild(collectionCard)
	})

	// Добавление обработчиков событий для кнопок редактирования и удаления
	document.querySelectorAll('.edit-collection').forEach(button => {
		button.addEventListener('click', e => {
			e.stopPropagation()
			const id = button.getAttribute('data-id')
			editCollectionName(id)
		})
	})

	document.querySelectorAll('.delete-collection').forEach(button => {
		button.addEventListener('click', e => {
			e.stopPropagation()
			const id = button.getAttribute('data-id')
			if (confirm('Вы уверены, что хотите удалить эту подборку?')) {
				deleteCollection(id)
				renderCollections()
			}
		})
	})
}

function renderCards(collectionId) {
	const collection = collections.find(c => c.id === collectionId)
	if (!collection) return

	const cardList = document.getElementById('card-list')
	cardList.innerHTML = ''

	if (collection.cards.length === 0) {
		cardList.innerHTML =
			'<p>Пока нет карточек. Добавьте свою первую карточку, чтобы начать.</p>'
		return
	}

	collection.cards.forEach(card => {
		const cardItem = document.createElement('div')
		cardItem.className = 'card-item'
		cardItem.innerHTML = `
            <div class="card-title">${card.title}</div>
            <div class="card-actions">
                <button class="secondary edit-card" data-id="${card.id}">
                    <i class="fas fa-edit"></i> Редактировать
                </button>
                <button class="warning delete-card" data-id="${card.id}">
                    <i class="fas fa-trash"></i> Удалить
                </button>
            </div>
        `

		cardList.appendChild(cardItem)
	})

	// Добавление обработчиков событий для кнопок редактирования и удаления карточек
	document.querySelectorAll('.edit-card').forEach(button => {
		button.addEventListener('click', () => {
			const id = button.getAttribute('data-id')
			editCard(collectionId, id)
		})
	})

	document.querySelectorAll('.delete-card').forEach(button => {
		button.addEventListener('click', () => {
			const id = button.getAttribute('data-id')
			if (confirm('Вы уверены, что хотите удалить эту карточку?')) {
				deleteCard(collectionId, id)
				renderCards(collectionId)
			}
		})
	})
}

// Функции навигации
function showCollectionsView() {
	collectionsView.classList.remove('hidden')
	collectionModal.classList.add('hidden')
	editCollectionView.classList.add('hidden')
	cardModal.classList.add('hidden')
	learningView.classList.add('hidden')

	renderCollections()
}

function showCollectionModal(isEdit = false, collectionId = null) {
	collectionsView.classList.add('hidden')
	collectionModal.classList.remove('hidden')

	const modalTitle = document.getElementById('collection-modal-title')
	const collectionNameInput = document.getElementById('collection-name')

	if (isEdit && collectionId) {
		modalTitle.textContent = 'Редактировать подборку'
		const collection = collections.find(c => c.id === collectionId)
		if (collection) {
			collectionNameInput.value = collection.name
			collectionModal.setAttribute('data-id', collectionId)
		}
	} else {
		modalTitle.textContent = 'Создать новую подборку'
		collectionNameInput.value = ''
		collectionModal.removeAttribute('data-id')
	}

	// Установка фокуса на поле ввода
	setTimeout(() => collectionNameInput.focus(), 100)
}

function showEditCollectionView(collectionId) {
	const collection = collections.find(c => c.id === collectionId)
	if (!collection) return

	currentCollection = collection

	collectionsView.classList.add('hidden')
	editCollectionView.classList.remove('hidden')

	document.getElementById('edit-collection-title').textContent = collection.name
	editCollectionView.setAttribute('data-id', collectionId)

	renderCards(collectionId)
}

function showCardModal(isEdit = false, cardId = null) {
	editCollectionView.classList.add('hidden')
	cardModal.classList.remove('hidden')

	// Сохраним ID коллекции в атрибуте модального окна карточки
	cardModal.setAttribute('data-collection-id', currentCollection.id)

	const modalTitle = document.getElementById('card-modal-title')
	const cardTitleInput = document.getElementById('card-title')
	const cardContentInput = document.getElementById('card-content')

	if (isEdit && cardId) {
		modalTitle.textContent = 'Редактировать карточку'
		const card = currentCollection.cards.find(c => c.id === cardId)
		if (card) {
			cardTitleInput.value = card.title
			cardContentInput.value = card.content
			cardModal.setAttribute('data-id', cardId)
		}
	} else {
		modalTitle.textContent = 'Добавить новую карточку'
		cardTitleInput.value = ''
		cardContentInput.value = ''
		cardModal.removeAttribute('data-id')
	}

	// Установка фокуса на поле ввода
	setTimeout(() => cardTitleInput.focus(), 100)
}

function showLearningView(collectionId) {
	const collection = collections.find(c => c.id === collectionId)
	if (!collection || collection.cards.length === 0) {
		alert('В этой подборке нет карточек для изучения.')
		return
	}

	currentCollection = collection
	editCollectionView.classList.add('hidden')
	learningView.classList.remove('hidden')

	document.getElementById('learning-collection-title').textContent =
		collection.name

	// Перемешивание карточек
	shuffledCardIndices = [...Array(collection.cards.length).keys()]
	for (let i = shuffledCardIndices.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[shuffledCardIndices[i], shuffledCardIndices[j]] = [
			shuffledCardIndices[j],
			shuffledCardIndices[i],
		]
	}

	currentCardIndex = 0
	showCard(currentCardIndex)

	// Обновление прогресса
	document.getElementById('current-card-index').textContent =
		currentCardIndex + 1
	document.getElementById('total-cards').textContent = collection.cards.length
}

// Функции режима обучения
function showCard(index) {
	const card = currentCollection.cards[shuffledCardIndices[index]]

	document.getElementById('current-card-front').textContent = card.title
	document.getElementById('current-card-back').textContent = card.content

	// Исправлен баг: явно скрываем содержимое карточки при загрузке
	document.getElementById('current-card-back').classList.add('hidden')
	document.getElementById('show-answer-btn').innerHTML =
		'<i class="fas fa-eye"></i> <span>Показать ответ</span>'

	// Обновление прогресса
	document.getElementById('current-card-index').textContent = index + 1
}

function showAnswer() {
	const cardBack = document.getElementById('current-card-back')
	const showAnswerBtn = document.getElementById('show-answer-btn')

	if (cardBack.classList.contains('hidden')) {
		cardBack.classList.remove('hidden')
		showAnswerBtn.innerHTML =
			'<i class="fas fa-eye-slash"></i> <span>Скрыть ответ</span>'
	} else {
		cardBack.classList.add('hidden')
		showAnswerBtn.innerHTML =
			'<i class="fas fa-eye"></i> <span>Показать ответ</span>'
	}
}

function nextCard() {
	if (currentCardIndex < currentCollection.cards.length - 1) {
		currentCardIndex++
		showCard(currentCardIndex)
	}
}

function prevCard() {
	if (currentCardIndex > 0) {
		currentCardIndex--
		showCard(currentCardIndex)
	}
}

// Функции действий
function openCollection(id) {
	showEditCollectionView(id)
}

function editCollectionName(id) {
	showCollectionModal(true, id)
}

function saveCollection() {
	const name = document.getElementById('collection-name').value.trim()
	if (!name) {
		alert('Пожалуйста, введите название подборки.')
		return
	}

	const collectionId = collectionModal.getAttribute('data-id')

	if (collectionId) {
		// Обновление существующей подборки
		updateCollection(collectionId, name)
	} else {
		// Создание новой подборки
		createCollection(name)
	}

	showCollectionsView()
}

function addCard() {
	const collectionId = editCollectionView.getAttribute('data-id')
	if (!collectionId) return

	showCardModal(false)
}

function editCard(collectionId, cardId) {
	showCardModal(true, cardId)
}

function saveCard() {
	const title = document.getElementById('card-title').value.trim()
	const content = document.getElementById('card-content').value.trim()

	if (!title) {
		alert('Пожалуйста, введите название карточки.')
		return
	}

	if (!content) {
		alert('Пожалуйста, введите содержание карточки.')
		return
	}

	const collectionId = currentCollection.id
	const cardId = cardModal.getAttribute('data-id')

	if (cardId) {
		// Обновление существующей карточки
		updateCard(collectionId, cardId, title, content)
	} else {
		// Создание новой карточки
		createCard(collectionId, title, content)
	}

	showEditCollectionView(collectionId)
}

function startLearning() {
	const collectionId = editCollectionView.getAttribute('data-id')
	if (!collectionId) return

	showLearningView(collectionId)
}

function handleFileImport(event) {
	const file = event.target.files[0]
	if (!file) return

	const reader = new FileReader()
	reader.onload = function (e) {
		importCollection(e.target.result)
	}
	reader.readAsText(file)

	// Сбрасываем input для возможности повторного выбора того же файла
	event.target.value = ''
}

// Обработка клавиатурных сокращений
function handleKeyboardShortcuts(event) {
	console.log('Нажата клавиша:', event.key)

	// Обработка клавиши Escape везде
	if (event.key === 'Escape') {
		// Если открыто модальное окно карточки, закрываем его
		if (!cardModal.classList.contains('hidden')) {
			console.log('Escape: закрытие модального окна карточки')
			closeCardModal()
			return
		}

		// Если открыто модальное окно подборки, возвращаемся к списку подборок
		if (!collectionModal.classList.contains('hidden')) {
			console.log('Escape: возврат к списку подборок')
			showCollectionsView()
			return
		}

		// Если в режиме обучения, возвращаемся к редактированию подборки
		if (!learningView.classList.contains('hidden')) {
			console.log('Escape: выход из режима обучения')
			showEditCollectionView(currentCollection.id)
			return
		}
	}

	// Если в режиме обучения, обрабатываем стрелки и пробел
	if (!learningView.classList.contains('hidden')) {
		if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
			nextCard()
		} else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
			prevCard()
		} else if (event.key === ' ' || event.key === 'Enter') {
			showAnswer()
			event.preventDefault() // Предотвращаем прокрутку страницы при нажатии пробела
		}
	}
}

// Обработчики событий
function attachEventListeners() {
	// Переключение темы
	themeToggle.addEventListener('click', toggleTheme)

	// События модального окна подборки
	document
		.getElementById('create-collection-btn')
		.addEventListener('click', () => showCollectionModal())
	document
		.getElementById('save-collection-btn')
		.addEventListener('click', saveCollection)
	document
		.getElementById('cancel-collection-btn')
		.addEventListener('click', showCollectionsView)

	// События представления редактирования подборки
	document.getElementById('add-card-btn').addEventListener('click', addCard)
	document
		.getElementById('start-learning-btn')
		.addEventListener('click', startLearning)
	document
		.getElementById('back-to-collections-btn')
		.addEventListener('click', showCollectionsView)
	document
		.getElementById('export-collection-btn')
		.addEventListener('click', () => {
			const collectionId = currentCollection.id
			exportCollection(collectionId)
		})

	// События импорта подборок
	document
		.getElementById('import-collection-btn')
		.addEventListener('click', () => {
			document.getElementById('import-file').click()
		})
	document
		.getElementById('import-file')
		.addEventListener('change', handleFileImport)

	// События модального окна карточки - ИСПРАВЛЕНО
	document.getElementById('save-card-btn').addEventListener('click', saveCard)

	// Новый прямой обработчик для кнопки "Отмена"
	const cancelCardBtn = document
		.getElementById('cancel-card-btn')
		.addEventListener('click', function (e) {
			e.preventDefault()
			e.stopPropagation()
			console.log('Кнопка Отмена нажата')
			closeCardModal()
		})

	// События представления режима обучения
	document
		.getElementById('show-answer-btn')
		.addEventListener('click', showAnswer)
	document.getElementById('next-card-btn').addEventListener('click', nextCard)
	document.getElementById('prev-card-btn').addEventListener('click', prevCard)
	document.getElementById('exit-learning-btn').addEventListener('click', () => {
		showEditCollectionView(currentCollection.id)
	})

	// Клавиатурные сокращения
	document.addEventListener('keydown', handleKeyboardShortcuts)

	// Обработка закрытия модальных окон при клике на оверлей
	document
		.querySelector('#collection-modal .modal-overlay')
		.addEventListener('click', showCollectionsView)
	document
		.querySelector('#card-modal .modal-overlay')
		.addEventListener('click', () => {
			showEditCollectionView(currentCollection.id)
		})
}

// Функция для кнопки отмены редактирования карточки
function cancelCardEdit() {
	console.log('Кнопка Отмена нажата через встроенный обработчик')
	if (currentCollection && currentCollection.id) {
		showEditCollectionView(currentCollection.id)
	} else {
		showCollectionsView()
	}
}

// Поддержка swipe для мобильных устройств в режиме обучения
function initTouchSwipe() {
	let startX, startY
	const flashcard = document.querySelector('.flashcard')

	flashcard.addEventListener(
		'touchstart',
		e => {
			startX = e.touches[0].clientX
			startY = e.touches[0].clientY
		},
		false
	)

	flashcard.addEventListener(
		'touchend',
		e => {
			if (!startX || !startY) return

			const endX = e.changedTouches[0].clientX
			const endY = e.changedTouches[0].clientY

			const diffX = startX - endX
			const diffY = startY - endY

			// Если горизонтальный свайп значительнее вертикального
			if (Math.abs(diffX) > Math.abs(diffY)) {
				if (Math.abs(diffX) > 50) {
					// Минимальное расстояние свайпа
					if (diffX > 0) {
						// Свайп влево - следующая карточка
						nextCard()
					} else {
						// Свайп вправо - предыдущая карточка
						prevCard()
					}
				}
			} else {
				// Вертикальный свайп значительнее
				if (Math.abs(diffY) > 50) {
					// Свайп вверх или вниз - показать/скрыть ответ
					showAnswer()
				}
			}

			startX = null
			startY = null
		},
		false
	)
}

// Инициализация приложения при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
	init()
	initTouchSwipe()
})

// Дополнительный обработчик для кнопки отмены
window.addEventListener('DOMContentLoaded', function () {
	setTimeout(function () {
		const cancelBtn = document.getElementById('cancel-card-btn')
		if (cancelBtn) {
			cancelBtn.onclick = function () {
				console.log('Кнопка Отмена нажата через отложенный обработчик')
				if (currentCollection && currentCollection.id) {
					showEditCollectionView(currentCollection.id)
				} else {
					showCollectionsView()
				}
				return false
			}
		}
	}, 500)
})

setTimeout(function () {
	document.removeEventListener('keydown', handleKeyboardShortcuts)
	document.addEventListener('keydown', handleKeyboardShortcuts)
	console.log('Обработчик клавиши Escape переустановлен')
}, 1000)

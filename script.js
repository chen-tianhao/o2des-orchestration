const LANGUAGE_KEY = 'o2des-preferred-language';
const PREFERS_REDUCED_MOTION = window.matchMedia
	? window.matchMedia('(prefers-reduced-motion: reduce)').matches
	: false;

const setLanguage = (lang = 'en') => {
	const normalized = lang === 'zh' ? 'zh' : 'en';
	document.body.classList.remove('lang-en', 'lang-zh');
	document.body.classList.add(`lang-${normalized}`);
	document.documentElement.setAttribute('lang', normalized === 'zh' ? 'zh-Hans' : 'en');
	localStorage.setItem(LANGUAGE_KEY, normalized);

	document.querySelectorAll('[data-switch-lang]').forEach((btn) => {
		btn.classList.toggle('active', btn.dataset.switchLang === normalized);
	});

	document.querySelectorAll('[data-lang]').forEach((node) => {
		node.hidden = node.dataset.lang !== normalized;
	});
};

const initYear = () => {
	const yearTargets = document.querySelectorAll('#year, #year-copy');
	if (!yearTargets.length) return;
	const currentYear = new Date().getFullYear();
	yearTargets.forEach((node) => (node.textContent = currentYear));
};

const initContactForm = () => {
	const contactForm = document.querySelector('.contact-form');
	if (!contactForm) return;
	contactForm.addEventListener('submit', (event) => {
		event.preventDefault();
		contactForm.classList.add('submitted');
		const status = contactForm.querySelector('.form-status');
		if (status) {
			status.hidden = false;
		}
	});
};

const initScrollReveal = () => {
		const animatedNodes = document.querySelectorAll('[data-animate]');
		if (!animatedNodes.length) return;

		if (PREFERS_REDUCED_MOTION) {
			animatedNodes.forEach((node) => node.classList.add('is-visible'));
			return;
		}

	if ('IntersectionObserver' in window) {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add('is-visible');
						observer.unobserve(entry.target);
					}
				});
			},
			{
				threshold: 0.15,
				rootMargin: '0px 0px -10% 0px',
			}
		);

		animatedNodes.forEach((node) => observer.observe(node));
	} else {
		animatedNodes.forEach((node) => node.classList.add('is-visible'));
	}
};

const initParallax = () => {
		const parallaxNodes = PREFERS_REDUCED_MOTION ? [] : document.querySelectorAll('[data-parallax]');
	const header = document.querySelector('.site-header');
		if (!parallaxNodes.length && !header) return;

	let lastScrollY = window.scrollY;
	let ticking = false;

	const update = () => {
			parallaxNodes.forEach((node) => {
				const speed = parseFloat(node.dataset.parallax) || 0.15;
				node.style.transform = `translate3d(0, ${lastScrollY * speed * -1}px, 0)`;
			});
		if (header) {
			header.classList.toggle('is-condensed', lastScrollY > 40);
		}
		ticking = false;
	};

	const onScroll = () => {
		lastScrollY = window.scrollY;
		if (!ticking) {
			requestAnimationFrame(update);
			ticking = true;
		}
	};

	update();
	window.addEventListener('scroll', onScroll, { passive: true });
};

const initTiltCards = () => {
		if (PREFERS_REDUCED_MOTION) return;

		const tiltNodes = document.querySelectorAll('[data-tilt]');
	if (!tiltNodes.length) return;

	tiltNodes.forEach((node) => {
		const handleMove = (event) => {
			const rect = node.getBoundingClientRect();
			const x = (event.clientX - rect.left) / rect.width;
			const y = (event.clientY - rect.top) / rect.height;
			const rotateX = (0.5 - y) * 10;
			const rotateY = (x - 0.5) * 10;
			node.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
			node.style.setProperty('--glow-x', `${x * 100}%`);
			node.style.setProperty('--glow-y', `${y * 100}%`);
			node.classList.add('tilt-active');
		};

		const reset = () => {
			node.style.transform = '';
			node.classList.remove('tilt-active');
		};

		node.addEventListener('pointermove', handleMove);
		node.addEventListener('pointerleave', reset);
		node.addEventListener('pointerup', reset);
	});
};

document.addEventListener('DOMContentLoaded', () => {
	const storedLang = localStorage.getItem(LANGUAGE_KEY) || 'en';
	setLanguage(storedLang);

	document.querySelectorAll('[data-switch-lang]').forEach((button) => {
		button.addEventListener('click', () => setLanguage(button.dataset.switchLang));
	});

	initYear();
	initContactForm();
	initScrollReveal();
	initParallax();
	initTiltCards();
});

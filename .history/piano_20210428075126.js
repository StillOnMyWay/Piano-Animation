(function () {
	const canvas = document.getElementById("piano");
	const SOUNDS = document.querySelectorAll('audio');

	let stage, renderer, loader, ticker;
	const W = 700;
	const H = 495;
	const PATH = 'images';

	let curImage, curImageIndex;
	let curSound, curSoundIndex;
	let msk;
	let isAnimating = false;
	const ROT_Y = 30;
	const ROT_X = 30;
	let lastPos = { x: 0, y: 0 };
	let mousePos = { x: 0, y: 0 };

	const MASK_JSON = 'images/mask-bw.json';
	// const MASK_JSON = 'images/mask.json';

	const IMAGES_PIANO = ["https://static.wixstatic.com/media/1369f0_4b25c6ff75a84e60915152d3d445690a~mv2.jpg", "https://static.wixstatic.com/media/1369f0_afd38dd311884a1a9efd769277ba5217~mv2.jpg", "https://static.wixstatic.com/media/1369f0_d20bff54d7714195bf5622acfec168e8~mv2.jpg", "https://static.wixstatic.com/media/1369f0_464859f283d8425088fd938de58e7c3c~mv2.jpg", "https://static.wixstatic.com/media/1369f0_88e7cf977f124022866724a634093102~mv2.jpg", "https://static.wixstatic.com/media/1369f0_3fe2b96cdfd1470bbeaac04b281d8727~mv2.jpg", "https://static.wixstatic.com/media/1369f0_0c3640e9886247148cb1ef1c2a9a2aff~mv2.jpg", "https://static.wixstatic.com/media/1369f0_6223ce00ef6c4ec8a902033149773c92~mv2.jpg"];
	
	let imagesPiano;

	ticker = PIXI.Ticker.shared;
	loader = PIXI.Loader.shared;

	IMAGES_PIANO.forEach(url => loader.add(url));
	loader.add(MASK_JSON);

	loader.load(init);

	function init() {
		initPixi();
		imagesPiano = createSprites();
		msk = createSpritesheet();
		stage.addChild(msk);

		// stage.interactive = true;
		// stage.on('click', onClickNext);

		curImageIndex = 0;
		curSoundIndex = 0;
		showImage(0);

		// renderer.render(stage);
		ticker.add(() => {
			renderer.render(stage);

			let x = mousePos.x;
			let y = mousePos.y;

			let ease = .95;
			let diffX = (lastPos.x - x) * ease;
			let diffY = (lastPos.y - y) * ease;

			x += diffX;
			y += diffY;

			if ((Math.abs(diffX) + Math.abs(diffY)) > .01) {
				const rX = -(ROT_X * y).toFixed(2);
				const rY = (ROT_Y * x).toFixed(2);

				lastPos = { x, y };
				// canvas.style.transform = `rotateX(${rX}deg) rotateY(${rY}deg)`;
				gsap.set(canvas, { rotationX: `${rX}deg`, rotationY: `${rY}deg` });
			}
		});

		initMouse();
	}

	function onClickNext() {
		if (isAnimating) return;

		// play anim
		let nextIndex = curImageIndex + 1;
		showImage(nextIndex);

		// play sound
		curSoundIndex %= SOUNDS.length;
		if (curSound) curSound.pause();
		curSound = SOUNDS[curSoundIndex];
		curSound.currentTime = 0;
		curSound.play();
		// console.log(curImageIndex + 1, ' >> ', nextIndex + 1, ' @ ', curSoundIndex + 1);
		curSoundIndex++;
	}

	function initMouse() {
		window.addEventListener('mousemove', onMove);

		canvas.addEventListener('click', onClickNext);
		canvas.addEventListener('touchstart', onClickNext);
		canvas.addEventListener('mouseover', onHover.bind(this, true));
		canvas.addEventListener('mouseout', onHover.bind(this, false));
	}

	function onHover(st) {
		gsap.to(canvas, { scale: st ? 1.2 : 1, duration: .65, ease: 'power2.inOut' });
	}

	function onMove(e) {
		let x = e.pageX;
		let y = e.pageY;

		x = (x / window.innerWidth - .5);
		y = (y / window.innerHeight - .5);

		mousePos = { x, y };
	}

	function createSpritesheet() {
		const json = loader.resources[MASK_JSON];
		const sheet = json.spritesheet;

		let frames = [];
		for (let key in sheet.data.frames) {
			frames.push(PIXI.Texture.from(key));
		}
		frames.reverse();

		let movie = new PIXI.AnimatedSprite(frames);
		movie.anchor.set(0.5);
		// movie.pivot.set(movie.width / 2, movie.height / 2);		
		let b = fitObject(movie.texture, { width: W, height: H }, false);
		movie.width = b.width;
		movie.height = b.height * 1.7;
		movie.x = W / 2;
		movie.y = H / 2;

		movie.animationSpeed = 1.5;
		movie.loop = false;
		// movie.play();

		return movie;
	}

	function createSprites() {
		let sprites = [];

		IMAGES_PIANO.forEach(name => {
			sprites.push(getSprite(name));
		});

		return sprites;
	}

	function showImage(index) {
		index = index % IMAGES_PIANO.length;

		let image = imagesPiano[index];

		stage.addChild(image);
		image.mask = msk;

		// msk.rotation = 2 * Math.PI * Math.random();
		msk.rotation = (Math.PI / 4) * Math.floor(Math.random() * 8);
		msk.onComplete = finishAnimation.bind(this, image, index);

		isAnimating = true;
		msk.gotoAndStop(0);
		// msk.gotoAndPlay(0);
		// /*
		let time = { progress: 0 };
		gsap.to(time, {
			progress: 1,
			duration: 2.5,
			ease: 'power2.out',
			onUpdate: () => {
				let frame = Math.floor(time.progress * (msk.totalFrames - 1));
				// console.log(frame);
				msk.gotoAndStop(frame);
			},
			onComplete: msk.onComplete
		});
		// */
	}

	function finishAnimation(newImage, newIndex) {
		if (curImage) {
			curImage.parent.removeChild(curImage);
		}

		newImage.mask = null;
		isAnimating = false;
		curImage = newImage;
		curImageIndex = newIndex;
	};

	function initPixi() {
		stage = new PIXI.Container();
		renderer = new PIXI.Renderer({
			view: canvas,
			width: W,
			height: H,
			resolution: window.devicePixelRatio || 1,
			backgroundAlpha: 0,
			antialias: true,
			autoDensity: true,
		});
	}

	function getSprite(image) {
		let tx = PIXI.Texture.from(image);
		tx.resolution = window.devicePixelRatio;
		return new PIXI.Sprite(tx);
	}

	function fitObject(objBounds, fitBounds, cover = 1) {
		let obj = {
			width: objBounds.width,
			height: objBounds.height,
		};
		let kW = fitBounds.width / obj.width;
		let kH = fitBounds.height / obj.height;

		let k;

		if (cover == 1) {
			k = Math.min(kW, kH);
		} else {
			k = Math.max(kW, kH);
		}

		obj.width *= k;
		obj.height *= k;

		obj.scale = k;

		return obj;
	};


})('piano');
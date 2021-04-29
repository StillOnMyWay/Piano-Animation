(function (canvasId) {
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

	// const MASK_JSON = 'https://firebasestorage.googleapis.com/v0/b/threed-177102.appspot.com/o/mask-bw.json?alt=media&token=7c42ed4c-705b-4ac5-979f-24dc787078ad';
	const MASK_JSON = 'images/mask-bw.json';

	const IMAGES_PIANO = [
		PATH + '/piano/jpgs/rb_1.jpg',
		PATH + '/piano/jpgs/rb_2_UTD.jpg',
		PATH + '/piano/jpgs/rb_3_UTD.jpg',
		PATH + '/piano/jpgs/rb_4_UTD.jpg',
		PATH + '/piano/jpgs/rb_5_UTD.jpg',
		PATH + '/piano/jpgs/rb_6_UTD.jpg',
		PATH + '/piano/jpgs/rb_7_UTD.jpg',
		PATH + '/piano/jpgs/rb_8_UTD.jpg',
	];
	let imagesPiano;

	ticker = PIXI.Ticker.shared;
	loader = PIXI.Loader.shared;

	IMAGES_PIANO.forEach(url => loader.add(url));
	loader.add(MASK_JSON,{xhrType:'json'});

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
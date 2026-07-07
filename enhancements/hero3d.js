// hero3d.js
export function initHero3D() {
    const parent = document.querySelector('section:first-child');
    if(!parent) return;

    // Create container
    const heroCanvasContainer = document.createElement('div');
    heroCanvasContainer.id = 'hero-canvas';
    heroCanvasContainer.className = 'enhanced-hero';
    heroCanvasContainer.setAttribute('data-enhance', '3d-hero');
    
    // Fallback Image
    const poster = document.createElement('img');
    poster.src = 'assets/whisperflow-preview.png';
    poster.className = 'hero-poster-fallback';
    heroCanvasContainer.appendChild(poster);
    
    // Performance Mode Toggle
    const prefToggle = document.createElement('button');
    prefToggle.className = 'font-mono text-[10px] text-gray-500 hover:text-white transition-colors absolute bottom-8 right-8 z-50';
    prefToggle.innerHTML = '[ 3D Hero : ON ]';
    parent.appendChild(prefToggle);

    let is3dEnabled = true;
    let renderer, scene, camera, mesh, animationFrameId;

    // Check prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        is3dEnabled = false;
        prefToggle.innerHTML = '[ 3D Hero : OFF ]';
    }

    if (is3dEnabled) {
        // Load dynamically if Three is absent, though site already has Three available
        if (window.THREE) {
            setupThreeJS();
        } else {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
            script.onload = setupThreeJS;
            document.head.appendChild(script);
        }
    }

    function setupThreeJS() {
        if(!is3dEnabled) return;
        
        poster.style.display = 'none';

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
        camera.position.z = 10;

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize( window.innerWidth, window.innerHeight );
        heroCanvasContainer.appendChild( renderer.domElement );

        // Low Poly shape
        const geometry = new THREE.IcosahedronGeometry(3, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0x00F0FF, wireframe: true, transparent: true, opacity: 0.1 });
        mesh = new THREE.Mesh( geometry, material );
        mesh.position.set(2, 0, -2); // offset to right
        scene.add( mesh );

        animate();

        window.addEventListener('resize', onWindowResize);
    }

    function animate() {
        if (!is3dEnabled) return;
        animationFrameId = requestAnimationFrame( animate );

        mesh.rotation.x += 0.002;
        mesh.rotation.y += 0.003;

        renderer.render( scene, camera );
    }

    function onWindowResize() {
        if(!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( window.innerWidth, window.innerHeight );
    }

    prefToggle.addEventListener('click', () => {
        is3dEnabled = !is3dEnabled;
        if(is3dEnabled) {
            prefToggle.innerHTML = '[ 3D Hero : ON ]';
            if(!renderer) setupThreeJS();
            else {
                poster.style.display = 'none';
                renderer.domElement.style.display = 'block';
                animate();
            }
        } else {
            prefToggle.innerHTML = '[ 3D Hero : OFF ]';
            if(animationFrameId) cancelAnimationFrame(animationFrameId);
            if(renderer) renderer.domElement.style.display = 'none';
            poster.style.display = 'block';
        }
    });

    // Make position absolute inside first section
    parent.style.position = 'relative'; 
    parent.insertBefore(heroCanvasContainer, parent.firstChild);
}

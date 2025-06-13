// Virtual Robot Mouse Tracking System
class VirtualRobot {
    constructor() {
        this.container = document.querySelector('.virtual-human-container');
        this.head = document.querySelector('.robot-head');
        this.eyes = document.querySelector('.robot-eyes');
        this.leftPupil = document.querySelector('.left-pupil');
        this.rightPupil = document.querySelector('.right-pupil');
        this.leftIris = document.querySelector('.left-iris');
        this.rightIris = document.querySelector('.right-iris');
        this.antenna = document.querySelector('.robot-antenna');
        
        this.mouseX = window.innerWidth / 2;
        this.mouseY = window.innerHeight / 2;
        this.currentHeadRotation = 0;
        this.currentEyeRotation = 0;
        this.currentAntennaRotation = 0;
        this.targetHeadRotation = 0;
        this.targetEyeRotation = 0;
        this.targetAntennaRotation = 0;
        
        // Robot position (will be calculated)
        this.robotX = 0;
        this.robotY = 0;
        this.headCenterX = 0;
        this.headCenterY = 0;
        
        // Animation settings
        this.headSmoothness = 0.08;
        this.eyeSmoothness = 0.12;
        this.pupilSmoothness = 0.18;
        this.antennaSmoothness = 0.05;
        this.maxHeadRotation = 25; // degrees
        this.maxEyeRotation = 15; // degrees
        this.maxAntennaRotation = 12; // degrees
        this.pupilMaxMovement = 4; // pixels
        
        // Current pupil positions
        this.currentLeftPupilX = 0;
        this.currentLeftPupilY = 0;
        this.currentRightPupilX = 0;
        this.currentRightPupilY = 0;
        this.targetLeftPupilX = 0;
        this.targetLeftPupilY = 0;
        this.targetRightPupilX = 0;
        this.targetRightPupilY = 0;
        
        // Robot personality state
        this.blinkTimer = 0;
        this.isBlinking = false;
        this.lastBlinkTime = 0;
        this.isInitialized = false;
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        setTimeout(() => {
            this.verifyElements();
            this.calculateRobotPosition();
            this.bindEvents();
            this.startAnimation();
            this.startRobotBehaviors();
            this.isInitialized = true;
            console.log('Robot initialized successfully');
        }, 300);
        
        // Recalculate position on resize
        window.addEventListener('resize', () => {
            setTimeout(() => {
                this.calculateRobotPosition();
            }, 100);
        });
    }
    
    verifyElements() {
        console.log('Verifying robot elements:');
        console.log('Container:', !!this.container);
        console.log('Head:', !!this.head);
        console.log('Eyes:', !!this.eyes);
        console.log('Left Pupil:', !!this.leftPupil);
        console.log('Right Pupil:', !!this.rightPupil);
        console.log('Antenna:', !!this.antenna);
        
        // If elements are missing, try alternative selectors
        if (!this.head) {
            this.head = document.querySelector('.human-head');
            console.log('Using fallback head selector:', !!this.head);
        }
        if (!this.eyes) {
            this.eyes = document.querySelector('.human-eyes');
            console.log('Using fallback eyes selector:', !!this.eyes);
        }
    }
    
    calculateRobotPosition() {
        if (this.container) {
            const rect = this.container.getBoundingClientRect();
            this.robotX = rect.left + rect.width / 2;
            this.robotY = rect.top + rect.height * 0.3; // Position at head level
            this.headCenterX = this.robotX;
            this.headCenterY = this.robotY;
            
            console.log('Robot position calculated:', this.robotX, this.robotY);
        }
    }
    
    bindEvents() {
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.updateTargetRotations();
            this.updateTargetPupilPositions();
        });
        
        // Also track touch events for mobile
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                this.mouseX = e.touches[0].clientX;
                this.mouseY = e.touches[0].clientY;
                this.updateTargetRotations();
                this.updateTargetPupilPositions();
            }
        });
        
        console.log('Mouse events bound successfully');
    }
    
    updateTargetRotations() {
        if (!this.isInitialized) return;
        
        // Calculate distance and angle from robot to mouse
        const deltaX = this.mouseX - this.headCenterX;
        const deltaY = this.mouseY - this.headCenterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = Math.sqrt(window.innerWidth * window.innerWidth + window.innerHeight * window.innerHeight);
        
        // Normalize the distance (0 to 1)
        const normalizedDistance = Math.min(distance / (maxDistance * 0.5), 1);
        
        // Calculate rotation based on mouse position
        const horizontalInfluence = deltaX / (window.innerWidth * 0.5);
        const verticalInfluence = deltaY / (window.innerHeight * 0.5);
        
        // Head rotation (both horizontal and slight vertical)
        this.targetHeadRotation = horizontalInfluence * this.maxHeadRotation * normalizedDistance;
        
        // Eye rotation (more subtle than head)
        this.targetEyeRotation = horizontalInfluence * this.maxEyeRotation * normalizedDistance;
        
        // Antenna rotation (subtle tracking)
        this.targetAntennaRotation = horizontalInfluence * this.maxAntennaRotation * normalizedDistance * 0.5;
        
        // Add slight vertical tilt to head
        const verticalTilt = verticalInfluence * 6 * normalizedDistance;
        this.targetHeadRotation += verticalTilt;
    }
    
    updateTargetPupilPositions() {
        if (!this.isInitialized) return;
        
        const deltaX = this.mouseX - this.headCenterX;
        const deltaY = this.mouseY - this.headCenterY;
        
        // Normalize the deltas
        const normalizedX = Math.max(-1, Math.min(1, deltaX / (window.innerWidth * 0.4)));
        const normalizedY = Math.max(-1, Math.min(1, deltaY / (window.innerHeight * 0.4)));
        
        // Calculate pupil movement (more pronounced for robot eyes)
        this.targetLeftPupilX = normalizedX * this.pupilMaxMovement;
        this.targetLeftPupilY = normalizedY * this.pupilMaxMovement;
        this.targetRightPupilX = normalizedX * this.pupilMaxMovement;
        this.targetRightPupilY = normalizedY * this.pupilMaxMovement;
    }
    
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
    
    animate() {
        if (!this.isInitialized) return;
        
        const currentTime = performance.now();
        
        // Smooth interpolation for head rotation
        this.currentHeadRotation = this.lerp(
            this.currentHeadRotation,
            this.targetHeadRotation,
            this.headSmoothness
        );
        
        // Smooth interpolation for eye rotation
        this.currentEyeRotation = this.lerp(
            this.currentEyeRotation,
            this.targetEyeRotation,
            this.eyeSmoothness
        );
        
        // Smooth interpolation for antenna rotation
        this.currentAntennaRotation = this.lerp(
            this.currentAntennaRotation,
            this.targetAntennaRotation,
            this.antennaSmoothness
        );
        
        // Smooth interpolation for pupil positions
        this.currentLeftPupilX = this.lerp(this.currentLeftPupilX, this.targetLeftPupilX, this.pupilSmoothness);
        this.currentLeftPupilY = this.lerp(this.currentLeftPupilY, this.targetLeftPupilY, this.pupilSmoothness);
        this.currentRightPupilX = this.lerp(this.currentRightPupilX, this.targetRightPupilX, this.pupilSmoothness);
        this.currentRightPupilY = this.lerp(this.currentRightPupilY, this.targetRightPupilY, this.pupilSmoothness);
        
        // Apply transformations
        if (this.head) {
            this.head.style.transform = `rotate(${this.currentHeadRotation}deg)`;
        }
        
        if (this.eyes) {
            this.eyes.style.transform = `rotate(${this.currentEyeRotation * 0.3}deg)`;
        }
        
        if (this.antenna) {
            this.antenna.style.transform = `rotate(${this.currentAntennaRotation}deg)`;
        }
        
        // Apply pupil movements
        if (this.leftPupil && this.leftIris) {
            const leftTransform = `translate(${this.currentLeftPupilX}px, ${this.currentLeftPupilY}px)`;
            this.leftPupil.style.transform = leftTransform;
            this.leftIris.style.transform = leftTransform;
        }
        
        if (this.rightPupil && this.rightIris) {
            const rightTransform = `translate(${this.currentRightPupilX}px, ${this.currentRightPupilY}px)`;
            this.rightPupil.style.transform = rightTransform;
            this.rightIris.style.transform = rightTransform;
        }
        
        // Handle blinking animation
        this.handleBlinking(currentTime);
    }
    
    handleBlinking(currentTime) {
        // Random blinking every 2-5 seconds
        if (currentTime - this.lastBlinkTime > 2000 + Math.random() * 3000) {
            this.triggerBlink();
            this.lastBlinkTime = currentTime;
        }
    }
    
    triggerBlink() {
        if (this.isBlinking) return;
        
        this.isBlinking = true;
        const robotEyes = document.querySelectorAll('.robot-eye, .eye-pupil');
        
        // Blink animation
        robotEyes.forEach(eye => {
            const originalTransform = eye.style.transform || '';
            eye.style.transition = 'transform 0.1s ease-out';
            eye.style.transform = originalTransform + ' scaleY(0.1)';
        });
        
        setTimeout(() => {
            robotEyes.forEach(eye => {
                const transform = eye.style.transform.replace(' scaleY(0.1)', '');
                eye.style.transform = transform;
            });
            
            setTimeout(() => {
                robotEyes.forEach(eye => {
                    eye.style.transition = '';
                });
                this.isBlinking = false;
            }, 100);
        }, 150);
    }
    
    startAnimation() {
        const animationLoop = () => {
            this.animate();
            requestAnimationFrame(animationLoop);
        };
        animationLoop();
        console.log('Animation loop started');
    }
    
    startRobotBehaviors() {
        // Start periodic behaviors like LED pulsing variations
        setInterval(() => {
            this.createEnergyPulse();
        }, 3000 + Math.random() * 4000);
        
        // Occasionally adjust antenna position
        setInterval(() => {
            this.antennaSignalCheck();
        }, 6000 + Math.random() * 6000);
        
        console.log('Robot behaviors started');
    }
    
    createEnergyPulse() {
        const panelLights = document.querySelectorAll('.panel-lights circle, [fill="#FF00FF"], [fill="#00FF00"], [fill="#FF6600"]');
        panelLights.forEach((light, index) => {
            setTimeout(() => {
                const originalFilter = light.style.filter || '';
                light.style.filter = 'brightness(2.5) drop-shadow(0 0 15px currentColor)';
                setTimeout(() => {
                    light.style.filter = originalFilter;
                }, 400);
            }, index * 80);
        });
    }
    
    antennaSignalCheck() {
        if (this.antenna) {
            // Subtle antenna movement indicating signal processing
            const originalTransform = this.antenna.style.transform || '';
            this.antenna.style.transition = 'transform 0.6s ease-in-out';
            this.antenna.style.transform = originalTransform + ' rotate(8deg)';
            
            setTimeout(() => {
                this.antenna.style.transform = originalTransform;
                setTimeout(() => {
                    this.antenna.style.transition = '';
                }, 600);
            }, 1200);
        }
    }
}

// Enhanced Cyberpunk Effects for Robot
class CyberpunkRobotEffects {
    constructor() {
        this.init();
    }
    
    init() {
        console.log('Initializing cyberpunk effects...');
        setTimeout(() => {
            this.setupGlitchEffect();
            this.setupCardHoverEffects();
            this.setupScrollAnimations();
            this.setupTypingEffect();
            this.setupRobotInteractions();
            console.log('Cyberpunk effects initialized');
        }, 500);
    }
    
    setupRobotInteractions() {
        // Robot responds to scroll
        let lastScrollY = window.scrollY;
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            const scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';
            
            if (Math.abs(currentScrollY - lastScrollY) > 30) {
                this.robotScrollReaction(scrollDirection);
            }
            
            lastScrollY = currentScrollY;
        });
        
        // Robot responds to section visibility
        this.observeSections();
        console.log('Robot interactions set up');
    }
    
    robotScrollReaction(direction) {
        const robotEyes = document.querySelectorAll('.robot-eye, .eye-pupil');
        const color = direction === 'down' ? '#00FF00' : '#FF00FF';
        
        robotEyes.forEach(eye => {
            const originalFill = eye.getAttribute('fill') || eye.style.fill;
            eye.setAttribute('fill', color);
            eye.style.fill = color;
            
            setTimeout(() => {
                if (originalFill) {
                    eye.setAttribute('fill', originalFill);
                    eye.style.fill = originalFill;
                } else {
                    eye.removeAttribute('fill');
                    eye.style.fill = '';
                }
            }, 800);
        });
    }
    
    observeSections() {
        const sections = document.querySelectorAll('.section');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.robotSectionReaction(entry.target);
                }
            });
        }, { threshold: 0.3 });
        
        sections.forEach(section => observer.observe(section));
    }
    
    robotSectionReaction(section) {
        // Robot shows different LED patterns for different sections
        const sectionClass = section.className;
        let color = '#00FFFF';
        
        if (sectionClass.includes('about')) color = '#00FF00';
        else if (sectionClass.includes('references')) color = '#FF00FF';
        else if (sectionClass.includes('video')) color = '#FF6600';
        
        const statusLEDs = document.querySelectorAll('[fill="#FF00FF"], [fill="#FF6600"], .panel-lights circle');
        statusLEDs.forEach(led => {
            const originalFill = led.getAttribute('fill') || led.style.fill;
            led.setAttribute('fill', color);
            led.style.fill = color;
            
            setTimeout(() => {
                if (originalFill) {
                    led.setAttribute('fill', originalFill);
                    led.style.fill = originalFill;
                } else {
                    led.removeAttribute('fill');
                    led.style.fill = '';
                }
            }, 2500);
        });
    }
    
    setupGlitchEffect() {
        const glitchText = document.querySelector('.glitch-text');
        if (glitchText) {
            setInterval(() => {
                if (Math.random() < 0.15) { // 15% chance every interval
                    glitchText.style.animation = 'none';
                    glitchText.offsetHeight; // Trigger reflow
                    glitchText.style.animation = 'glitch-1 0.4s ease-in-out';
                }
            }, 1500);
            console.log('Glitch effect set up');
        }
    }
    
    setupCardHoverEffects() {
        const cards = document.querySelectorAll('.cyber-card');
        cards.forEach(card => {
            card.addEventListener('mouseenter', (e) => {
                this.createHoverParticles(e.target);
                this.robotCardReaction();
            });
            
            card.addEventListener('mouseleave', (e) => {
                this.robotCardLeave();
            });
        });
        console.log(`Set up hover effects for ${cards.length} cards`);
    }
    
    robotCardReaction() {
        // Robot's eyes glow when hovering over cards
        const robotEyes = document.querySelectorAll('.robot-eye, .eye-pupil');
        robotEyes.forEach(eye => {
            eye.style.filter = 'brightness(1.8) drop-shadow(0 0 12px currentColor)';
        });
    }
    
    robotCardLeave() {
        // Reset robot eyes when leaving cards
        const robotEyes = document.querySelectorAll('.robot-eye, .eye-pupil');
        robotEyes.forEach(eye => {
            eye.style.filter = '';
        });
    }
    
    createHoverParticles(element) {
        const rect = element.getBoundingClientRect();
        const particleCount = 12;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: fixed;
                width: 6px;
                height: 6px;
                background: var(--cyber-cyan);
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                box-shadow: 0 0 10px var(--cyber-cyan);
            `;
            
            const x = rect.left + Math.random() * rect.width;
            const y = rect.top + Math.random() * rect.height;
            
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            
            document.body.appendChild(particle);
            
            // Animate particle
            const animation = particle.animate([
                { 
                    transform: 'translate(0, 0) scale(1)', 
                    opacity: 1 
                },
                { 
                    transform: `translate(${(Math.random() - 0.5) * 150}px, ${-80 - Math.random() * 80}px) scale(0)`, 
                    opacity: 0 
                }
            ], {
                duration: 1500 + Math.random() * 800,
                easing: 'ease-out'
            });
            
            animation.onfinish = () => {
                particle.remove();
            };
        }
    }
    
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeInUp 0.8s ease-out forwards';
                }
            });
        }, observerOptions);
        
        // Observe all cards and sections
        const animatedElements = document.querySelectorAll('.cyber-card, .section-title');
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            observer.observe(el);
        });
        
        // Add CSS animation
        if (!document.querySelector('#scroll-animations')) {
            const style = document.createElement('style');
            style.id = 'scroll-animations';
            style.textContent = `
                @keyframes fadeInUp {
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        console.log(`Set up scroll animations for ${animatedElements.length} elements`);
    }
    
    setupTypingEffect() {
        const typeElements = document.querySelectorAll('.placeholder-text');
        typeElements.forEach((element, index) => {
            element.style.position = 'relative';
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setTimeout(() => {
                            this.addTypingCursor(entry.target);
                        }, index * 300);
                    }
                });
            }, { threshold: 0.5 });
            
            observer.observe(element);
        });
        console.log(`Set up typing effect for ${typeElements.length} elements`);
    }
    
    addTypingCursor(element) {
        const cursor = document.createElement('span');
        cursor.textContent = '▌';
        cursor.style.cssText = `
            color: var(--cyber-cyan);
            animation: blink 1s infinite;
            margin-left: 2px;
        `;
        
        element.appendChild(cursor);
        
        // Add blink animation
        if (!document.querySelector('#blink-animation')) {
            const style = document.createElement('style');
            style.id = 'blink-animation';
            style.textContent = `
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove cursor after 4 seconds
        setTimeout(() => {
            if (cursor.parentNode) {
                cursor.remove();
            }
        }, 4000);
    }
}

// Enhanced Performance Monitor
class PerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        
        if (window.location.hash === '#debug') {
            this.showFPSCounter();
            this.showRobotStatus();
        }
    }
    
    showFPSCounter() {
        const fpsCounter = document.createElement('div');
        fpsCounter.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: var(--cyber-green);
            padding: 5px 10px;
            border-radius: 5px;
            font-family: var(--font-mono);
            font-size: 12px;
            z-index: 10000;
            border: 1px solid var(--cyber-green);
        `;
        fpsCounter.textContent = 'FPS: 60';
        document.body.appendChild(fpsCounter);
        
        const updateFPS = () => {
            this.frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - this.lastTime >= 1000) {
                this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
                fpsCounter.textContent = `FPS: ${this.fps}`;
                this.frameCount = 0;
                this.lastTime = currentTime;
            }
            
            requestAnimationFrame(updateFPS);
        };
        
        updateFPS();
    }
    
    showRobotStatus() {
        const statusPanel = document.createElement('div');
        statusPanel.style.cssText = `
            position: fixed;
            top: 50px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: var(--cyber-cyan);
            padding: 10px;
            border-radius: 5px;
            font-family: var(--font-mono);
            font-size: 10px;
            z-index: 10000;
            border: 1px solid var(--cyber-cyan);
            min-width: 150px;
        `;
        statusPanel.innerHTML = `
            <div>ROBOT STATUS:</div>
            <div id="mouse-pos">Mouse: 0, 0</div>
            <div id="head-rot">Head: 0°</div>
            <div id="eye-track">Eyes: Active</div>
        `;
        document.body.appendChild(statusPanel);
        
        // Update status periodically
        setInterval(() => {
            const mousePosEl = document.getElementById('mouse-pos');
            const headRotEl = document.getElementById('head-rot');
            
            if (window.virtualRobot) {
                mousePosEl.textContent = `Mouse: ${Math.round(window.virtualRobot.mouseX)}, ${Math.round(window.virtualRobot.mouseY)}`;
                headRotEl.textContent = `Head: ${Math.round(window.virtualRobot.currentHeadRotation)}°`;
            }
        }, 200);
    }
}

// Navigation System
class CyberNavigation {
    constructor() {
        this.navToggle = document.querySelector('.nav-toggle');
        this.navMenu = document.querySelector('.nav-menu');
        this.navLinks = document.querySelectorAll('.nav-link');
        this.sections = document.querySelectorAll('section[id], header[id]');
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.setupScrollSpy();
        this.setupSmoothScrolling();
        console.log('Navigation system initialized');
    }
    
    bindEvents() {
        // Mobile menu toggle
        if (this.navToggle) {
            this.navToggle.addEventListener('click', () => {
                this.toggleMobileMenu();
            });
        }
        
        // Close mobile menu when clicking on links
        this.navLinks.forEach(link => {
            link.addEventListener('click', () => {
                this.closeMobileMenu();
            });
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.cyber-nav')) {
                this.closeMobileMenu();
            }
        });
        
        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
            }
        });
    }
    
    toggleMobileMenu() {
        this.navMenu.classList.toggle('active');
        this.navToggle.classList.toggle('active');
        
        // Animate toggle lines
        const lines = this.navToggle.querySelectorAll('.nav-toggle-line');
        if (this.navMenu.classList.contains('active')) {
            lines[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            lines[1].style.opacity = '0';
            lines[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            lines[0].style.transform = '';
            lines[1].style.opacity = '';
            lines[2].style.transform = '';
        }
    }
    
    closeMobileMenu() {
        this.navMenu.classList.remove('active');
        this.navToggle.classList.remove('active');
        
        // Reset toggle lines
        const lines = this.navToggle.querySelectorAll('.nav-toggle-line');
        lines.forEach(line => {
            line.style.transform = '';
            line.style.opacity = '';
        });
    }
    
    setupScrollSpy() {
        const observerOptions = {
            threshold: 0.3,
            rootMargin: '-80px 0px -80px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.updateActiveNavLink(entry.target.id);
                }
            });
        }, observerOptions);
        
        this.sections.forEach(section => {
            observer.observe(section);
        });
    }
    
    updateActiveNavLink(activeId) {
        this.navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${activeId}`) {
                link.classList.add('active');
                link.parentElement.classList.add('active');
            } else {
                link.classList.remove('active');
                link.parentElement.classList.remove('active');
            }
        });
    }
    
    setupSmoothScrolling() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    const targetElement = document.getElementById(targetId);
                    
                    if (targetElement) {
                        const offsetTop = targetElement.offsetTop - 80; // Account for fixed nav
                        
                        window.scrollTo({
                            top: offsetTop,
                            behavior: 'smooth'
                        });
                        
                        // Robot reaction to navigation
                        this.robotNavigationReaction(targetId);
                    }
                }
            });
        });
    }
    
    robotNavigationReaction(sectionId) {
        // Robot shows different reactions for different sections
        const robotEyes = document.querySelectorAll('.robot-eye, .eye-pupil');
        const statusLEDs = document.querySelectorAll('.panel-lights circle');
        
        let eyeColor = '#00FFFF';
        let ledColor = '#00FFFF';
        
        switch(sectionId) {
            case 'home':
                eyeColor = '#00FFFF';
                ledColor = '#00FFFF';
                break;
            case 'about':
                eyeColor = '#00FF00';
                ledColor = '#00FF00';
                break;
            case 'references':
                eyeColor = '#FF00FF';
                ledColor = '#FF00FF';
                break;
            case 'video':
                eyeColor = '#FF6600';
                ledColor = '#FF6600';
                break;
        }
        
        // Animate robot reaction
        robotEyes.forEach(eye => {
            const originalFill = eye.getAttribute('fill') || eye.style.fill;
            eye.setAttribute('fill', eyeColor);
            eye.style.filter = 'brightness(2) drop-shadow(0 0 15px currentColor)';
            
            setTimeout(() => {
                if (originalFill) {
                    eye.setAttribute('fill', originalFill);
                } else {
                    eye.removeAttribute('fill');
                }
                eye.style.filter = '';
            }, 1500);
        });
        
        // LED reaction
        statusLEDs.forEach((led, index) => {
            setTimeout(() => {
                const originalFill = led.getAttribute('fill') || led.style.fill;
                led.setAttribute('fill', ledColor);
                led.style.filter = 'brightness(2.5) drop-shadow(0 0 15px currentColor)';
                
                setTimeout(() => {
                    if (originalFill) {
                        led.setAttribute('fill', originalFill);
                    } else {
                        led.removeAttribute('fill');
                    }
                    led.style.filter = '';
                }, 800);
            }, index * 100);
        });
    }
}

// Initialize Robot Application
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing Robot Application');
    
    // Add loading animation
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.6s ease-in-out';
    
    // Initialize all systems after a short delay to ensure DOM is ready
    setTimeout(() => {
        console.log('Starting robot initialization...');
        
        window.virtualRobot = new VirtualRobot();
        window.cyberpunkEffects = new CyberpunkRobotEffects();
        window.performanceMonitor = new PerformanceMonitor();
        window.cyberNavigation = new CyberNavigation();
        
        document.body.style.opacity = '1';
        
        console.log('🤖 Cyberpunk Robot Research Portal fully initialized');
        
        // Add a visual indicator that the robot is active
        setTimeout(() => {
            const robotEyes = document.querySelectorAll('.robot-eye, .eye-pupil');
            robotEyes.forEach(eye => {
                eye.style.filter = 'brightness(1.5) drop-shadow(0 0 10px currentColor)';
                setTimeout(() => {
                    eye.style.filter = '';
                }, 1000);
            });
        }, 1000);
        
    }, 400);
    
    // Console easter egg
    console.log(`
    %c╔═══════════════════════════════════════╗
    ║     CYBERPUNK ROBOT RESEARCH PORTAL   ║
    ║                                       ║
    ║     System Status: ONLINE             ║
    ║     Virtual Robot: ACTIVE ✓           ║
    ║     Neural Interface: CONNECTED ✓     ║
    ║     AI Companion: OPERATIONAL ✓       ║
    ║     Mouse Tracking: ENABLED ✓         ║
    ║                                       ║
    ║     Welcome to the future of research ║
    ╚═══════════════════════════════════════╝
    `, 
    'color: #00FFFF; font-family: monospace; font-size: 12px; font-weight: bold;'
    );
    
    // Additional debugging info
    console.log('Available robot elements on page load:');
    console.log('- Robot container:', !!document.querySelector('.virtual-human-container'));
    console.log('- Robot head:', !!document.querySelector('.robot-head, .human-head'));
    console.log('- Robot eyes:', !!document.querySelector('.robot-eyes, .human-eyes'));
    console.log('- Robot pupils:', document.querySelectorAll('.robot-eye, .eye-pupil').length);
});
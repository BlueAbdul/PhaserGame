let game;
let sky

// global game options
let gameOptions = {
    platformStartSpeed: 650, //650
    spawnRange: [100, 350],
    platformSizeRange: [50, 250],
    playerGravity: 900,
    jumpForce: 700,
    playerStartPosition: 200,
    jumps: 2,
    mountainSpeed: 250,
    cartonRougePercent: 25,
    ballPercent : 50
}

window.onload = function() {

    // object containing configuration options
    let gameConfig = {
        type: Phaser.AUTO,
        width: 1334,
        height: 750,
        scene: playGame,
        backgroundColor: "#328fa8",

        // physics settings
        physics: {
            default: "arcade"
        }
    }
    game = new Phaser.Game(gameConfig);
    window.focus();
    resize();
    window.addEventListener("resize", resize, false);
}

// playGame scene
class playGame extends Phaser.Scene{
    constructor(){
        super("PlayGame");
    }
    preload(){
        this.load.image('stade', 'assets/stade.jpg');

        this.load.image("platform", "assets/ezaplatform.png", {
            frameWidth: 25,
            frameHeight: 250
        });
        this.load.spritesheet("cartonRouge", "assets/cartonRouge.png",{
            frameWidth: 75,
            frameHeight: 100
        });
        this.load.spritesheet("player", "assets/sprite-golf.png", {
            frameWidth: 289,
            frameHeight: 103
        });

        this.load.spritesheet("mountain", "assets/mountain.png", {
            frameWidth: 512,
            frameHeight: 512
        });
        this.load.spritesheet("ball", "assets/ball.png", {
            frameWidth: 36,
            frameHeight: 35
        });

    }

    create(){

        // background
        this.sky = this.add.tileSprite(0,0,3000,2248,"stade")

        // group with all active platforms.
        this.platformGroup = this.add.group({
            // once a platform is removed, it's added to the pool
            removeCallback: function(platform){
                platform.scene.platformPool.add(platform)
            }
        });

        this.cartonRougeGroup = this.add.group({
            // once a firecamp is removed, it's added to the pool
            removeCallback: function(cartonRouge){
                cartonRouge.scene.cartonRougePool.add(cartonRouge)
            }
        });
        this.dying = false;


        // pool
        this.platformPool = this.add.group({
            // once a platform is removed from the pool, it's added to the active platforms group
            removeCallback: function(platform){
                platform.scene.platformGroup.add(platform)
            }
        });

        this.cartonRougePool = this.add.group({

            // once a fire is removed from the pool, it's added to the active fire group
            removeCallback: function(cartonRouge){
                cartonRouge.scene.cartonRougeGroup.add(cartonRouge)
            }
        });

        // group with all active balls.
        this.ballGroup = this.add.group({

            // once a ball is removed, it's added to the pool
            removeCallback: function(ball){
                ball.scene.ballPool.add(ball)
            }
        });

        // ball pool
        this.ballPool = this.add.group({
            // once a ball is removed from the pool, it's added to the active balls group
            removeCallback: function(ball){
            }
        });

        // number of consecutive jumps made by the player
        this.playerJumps = 0;
        this.score = 0;

        // adding a platform to the game, the arguments are platform width and x position
        this.addPlatform(game.config.width, game.config.width / 2);

        // adding the player;
        this.player = this.physics.add.sprite(gameOptions.playerStartPosition, game.config.height / 2, "player");
        this.player.setGravityY(gameOptions.playerGravity);


        // setting collisions between the player and the platform group
        this.platformCollider = this.physics.add.collider(this.player, this.platformGroup);


        // Checking pour l'input utilisateur
        this.cursors = this.input.keyboard.createCursorKeys();

        // Animations
        this.anims.create({
            key: "rolling",
            frames: this.anims.generateFrameNumbers("player", {
                start: 0,
                end: 2
            }),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: "warning",
            frames: this.anims.generateFrameNumbers("cartonRouge", {
                start: 0,
                end: 2
            }),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: "dying",
            frames: this.anims.generateFrameNumbers("player", {
                start: 0,
                end: 3
            }),
            frameRate: 15,
            repeat: -1
        });

        this.anims.create({
            key: "ball",
            frames: this.anims.generateFrameNumbers("ball", {
                start: 0,
                end: 10
            }),
            frameRate: 15,
            repeat: -1
        });

        // group with all active mountains.
        this.mountainGroup = this.add.group();

        this.firstPlatform = false;

        // animation de la voiture en continue
        this.player.anims.play("rolling");

        // player au premier plan
        this.player.setDepth(1)

        // Score text
        this.scoreText = this.add.text(20, 0, `Score : 0 `, {
            fontFamily: "Arial",
            fontSize: 32,
            color: "#ffffff"
        });


        let ballCollider = this.physics.add.overlap(this.player, this.ballGroup, function(player, ball){
                this.score += 1
                this.scoreText.destroy();
                this.scoreText = this.add.text(20, 0, `Score ${this.score}`, {
                    fontFamily: "Arial",
                    fontSize: 32,
                    color: "#ffffff"
                });
                ball.destroy();
                if(this.score === 11){
                    alert('gagné')
                }
            this.tweens.add({
                targets: ball,
                y: ball.y - 100,
                alpha: 0,
                duration: 800,
                ease: "Cubic.easeOut",
                callbackScope: this,
                onComplete: function(){
                    this.ballGroup.killAndHide(ball);
                    this.ballGroup.remove(ball);
                }
            });

        }, null, this);

        // collision
        this.physics.add.overlap(this.player, this.cartonRougeGroup, function(player, cartonRouge){
            this.dying = true;
            this.player.anims.stop();
            this.player.setFrame(3);
            this.player.body.setVelocityY(-200);
            this.physics.world.removeCollider(this.platformCollider);

        },
            null,
            this
        );

        // adding a mountain
        this.addMountains()

        // player au premier plan
        this.player.setDepth(1)

    }

    // adding mountains
    addMountains(){
        let rightmostMountain = this.getRightmostMountain();
        if(rightmostMountain < game.config.width * 2){
            let mountain = this.physics.add.sprite(rightmostMountain + Phaser.Math.Between(100, 350), game.config.height + Phaser.Math.Between(0, 100), "mountain");
            mountain.setOrigin(0.5, 1);
            mountain.body.setVelocityX(gameOptions.mountainSpeed * -1)
            this.mountainGroup.add(mountain);
            mountain.setDepth(0);
            mountain.setFrame(Phaser.Math.Between(0, 3))
            this.addMountains()
        }
    }

    // getting rightmost mountain x position
    getRightmostMountain(){
        let rightmostMountain = -200;
        this.mountainGroup.getChildren().forEach(function(mountain){
            rightmostMountain = Math.max(rightmostMountain, mountain.x);
        })
        return rightmostMountain;
    }

    // the core of the script: platform are added from the pool or created on the fly
    addPlatform(platformWidth, posX, posY){
        let platform;
        if(this.platformPool.getLength()){
            platform = this.platformPool.getFirst();
            platform.x = posX;
            platform.active = true;
            platform.visible = true;
            this.firstPlatform = true
            this.platformPool.remove(platform);
        }
        else{
            platform = this.physics.add.sprite(posX, game.config.height * 0.8, "platform");
            platform.setImmovable(true);
            platform.setVelocityX(gameOptions.platformStartSpeed * -1);
            this.platformGroup.add(platform);
        }

        if(this.firstPlatform){

            if(Phaser.Math.Between(1, 100) <= gameOptions.ballPercent){
                if(this.ballPool.getLength()){
                    let ball = this.ballPool.getFirst();
                    ball.x = posX;
                    ball.y = posY - 96;
                    ball.alpha = 1;
                    ball.active = true;
                    ball.visible = true;
                    this.ballPool.remove(ball);
                }
                else{
                    let ball = this.physics.add.sprite(posX, game.config.height * 0.70, "ball");
                    ball.setImmovable(true);
                    ball.setVelocityX(platform.body.velocity.x);
                    ball.anims.play("ball");
                    ball.setDepth(1);
                    this.ballGroup.add(ball);
                }
            }
    
            if(Phaser.Math.Between(1, 100) <= gameOptions.cartonRougePercent){
    
                if(this.cartonRougePool.getLength()){
                    let cartonRouge = this.cartonRougePool.getFirst();
                    cartonRouge.x = posX;
                    cartonRouge.y = posY - 46;
                    cartonRouge.alpha = 1;
                    cartonRouge.active = true;
                    cartonRouge.visible = true;
                    cartonRouge.setDepth(1)
                    this.cartonRougePool.remove(cartonRouge);
                }
                else{
                    let cartonRouge = this.physics.add.sprite(posX, game.config.height * 0.70, "cartonRouge");
                    cartonRouge.setVelocityX(platform.body.velocity.x);
                    cartonRouge.setSize(289, 103, true)
                    cartonRouge.setDepth(1);
                    this.cartonRougeGroup.add(cartonRouge);
                } }
        }
        // is there a ball over the platform?
        platform.displayWidth = posX;
        this.nextPlatformDistance = 0;

    }

    // the player jumps when on the ground, or once in the air as long as there are jumps left and the first jump was on the ground
    jump(){
        if(this.player.body.touching.down || (this.playerJumps > 0 && this.playerJumps < gameOptions.jumps)){
            if(this.player.body.touching.down){
                this.playerJumps = 0;
            }
            this.player.setVelocityY(gameOptions.jumpForce * -1);
            this.playerJumps ++;
        }
    }
    update(){
        // mouvement background
        this.sky.tilePositionX += 0.1

        // jump spacebar
        if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
           this.jump()
        }

        // game over
        if(this.player.y > game.config.height){
            alert('game over')
        }
        this.player.x = gameOptions.playerStartPosition;

        // recycling platforms
        let minDistance = game.config.width;
        this.platformGroup.getChildren().forEach(function(platform){
            let platformDistance = game.config.width - platform.x - platform.displayWidth / 2;
            minDistance = Math.min(minDistance, platformDistance);
            if(platform.x < - platform.displayWidth / 2){
                this.platformGroup.killAndHide(platform);
                this.platformGroup.remove(platform);
            }
        }, this);

        // adding new platforms
        if(minDistance > this.nextPlatformDistance){
            var nextPlatformWidth = Phaser.Math.Between(gameOptions.platformSizeRange[0], gameOptions.platformSizeRange[1]);
            this.addPlatform(nextPlatformWidth, game.config.width + nextPlatformWidth / 2);
        }

        // ajout de montagne
        this.addMountains()

        // Les plateformes generer sont au premier plan
        this.platformGroup.setDepth(1)
    }
}

function resize(){
    let canvas = document.querySelector("canvas");
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let windowRatio = windowWidth / windowHeight;
    let gameRatio = game.config.width / game.config.height;
    if(windowRatio < gameRatio){
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else{
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}

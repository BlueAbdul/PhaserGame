let game;
let sky

// global game options
let gameOptions = {
    platformStartSpeed: 250,
    spawnRange: [100, 350],
    platformSizeRange: [50, 250],
    playerGravity: 2000,
    jumpForce: 1000,
    playerStartPosition: 200,
    jumps: 50,
    mountainSpeed: 250,
    renaultPercent: 25,
    coinPercent : 100

}

window.onload = function() {

    // object containing configuration options
    let gameConfig = {
        type: Phaser.AUTO,
        width: 1334,
        height: 750,
        scene: [mainMenu, playGame, gameOver, gameWin],
        backgroundColor: "#FFFFFF",

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
        this.load.spritesheet("renault", "assets/sprite-renault.png",{
            frameWidth: 280,
            frameHeight: 103
        });
        this.load.spritesheet("player", "assets/sprite-golf.png", {
            frameWidth: 289,
            frameHeight: 103
        });

        this.load.spritesheet("mountain", "assets/mountain.png", {
            frameWidth: 512,
            frameHeight: 512
        });
        this.load.spritesheet("coin", "assets/coin.png", {
            frameWidth: 20,
            frameHeight: 20
        });

    }

    create(){
        this.sky = this.add.tileSprite(0,0,3000,2248,"stade")
        // group with all active platforms.
        this.platformGroup = this.add.group({

            // once a platform is removed, it's added to the pool
            removeCallback: function(platform){
                platform.scene.platformPool.add(platform)
            }
        });

        this.renaultGroup = this.add.group({

            // once a firecamp is removed, it's added to the pool
            removeCallback: function(renault){
                renault.scene.renaultPool.add(renault)
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

        this.renaultPool = this.add.group({

            // once a fire is removed from the pool, it's added to the active fire group
            removeCallback: function(renault){
                renault.scene.renaultGroup.add(renault)
            }
        });

        // group with all active coins.
        this.coinGroup = this.add.group({

            // once a coin is removed, it's added to the pool
            removeCallback: function(coin){
                coin.scene.coinPool.add(coin)
            }
        });

        // coin pool
        this.coinPool = this.add.group({

            // once a coin is removed from the pool, it's added to the active coins group
            removeCallback: function(coin){

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


        // checking for input
        this.cursors = this.input.keyboard.createCursorKeys();

        // setting cars animation
        this.anims.create({
            key: "rolling",
            frames: this.anims.generateFrameNumbers("player", {
                start: 0,
                end: 2
            }),
            frameRate: 15,
            repeat: -1
        });

        // group with all active mountains.
        this.mountainGroup = this.add.group();

        this.player.anims.play("rolling");

        this.anims.create({
            key: "warning",
            frames: this.anims.generateFrameNumbers("renault", {
                start: 0,
                end: 2
            }),
            frameRate: 15,
            repeat: -1
        });
        this.anims.create({
            key: "rotate",
            frames: this.anims.generateFrameNumbers("coin", {
                start: 0,
                end: 5
            }),
            frameRate: 15,
            yoyo: true,
            repeat: -1
        });
        this.player.setDepth(1)
        this.scoreText = this.add.text(20, 0, `Score : 0 `, {
            fontFamily: "Arial",
            fontSize: 32,
            color: "#ffffff"
        });


        let coinCollider = this.physics.add.overlap(this.player, this.coinGroup, function(player, coin){
                this.score += 1
                this.scoreText.destroy();
                this.scoreText = this.add.text(20, 0, `Score ${this.score}`, {
                    fontFamily: "Arial",
                    fontSize: 32,
                    color: "#ffffff"
                });
                coin.destroy();
                if(this.score == 11){
                    //alert('gagné')
                    this.scene.start('GameWin');
                }
            this.tweens.add({
                targets: coin,
                y: coin.y - 100,
                alpha: 0,
                duration: 800,
                ease: "Cubic.easeOut",
                callbackScope: this,
                onComplete: function(){
                    this.coinGroup.killAndHide(coin);
                    this.coinGroup.remove(coin);
                    console.log(this.score);

                }
            });

        }, null, this);

        this.physics.add.overlap(this.player, this.renaultGroup, function(player, renault){

            this.dying = true;
            this.player.anims.stop();
            this.player.setFrame(2);
            this.player.body.setVelocityY(-200);
            this.physics.world.removeCollider(this.platformCollider);

        }, null, this);



        // adding a mountain
        this.addMountains()
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
            this.platformPool.remove(platform);
        }
        else{
            platform = this.physics.add.sprite(posX, game.config.height * 0.8, "platform");
            platform.setImmovable(true);
            platform.setVelocityX(gameOptions.platformStartSpeed * -1);
            this.platformGroup.add(platform);
        }
        // is there a coin over the platform?
        if(Phaser.Math.Between(1, 100) <= gameOptions.coinPercent){
            if(this.coinPool.getLength()){
                let coin = this.coinPool.getFirst();
                coin.x = posX;
                coin.y = posY - 96;
                coin.alpha = 1;
                coin.active = true;
                coin.visible = true;
                this.coinPool.remove(coin);
            }
            else{
                let coin = this.physics.add.sprite(posX, game.config.height * 0.70, "coin");
                coin.setImmovable(true);
                coin.setVelocityX(platform.body.velocity.x);
                coin.setDepth(2);

                this.coinGroup.add(coin);
            }
        }

        if(Phaser.Math.Between(1, 100) <= gameOptions.renaultPercent){

            if(this.renaultPool.getLength()){
                let renault = this.renaultPool.getFirst();
                renault.x = posX;
                renault.y = posY - 46;
                renault.alpha = 1;
                renault.active = true;
                renault.visible = true;
                this.renaultPool.remove(renault);
            }
            else{
                let renault = this.physics.add.sprite(posX, game.config.height * 0.70, "renault");
                renault.setVelocityX(platform.body.velocity.x);
                renault.setSize(289, 103, true)
                renault.setDepth(1);
                this.renaultGroup.add(renault);
            } }
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
        this.sky.tilePositionX += 0.1


        if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            this.player.anims.play('turn')
           this.jump()
        }
        // game over
        if(this.player.y > game.config.height){

            //alert('game over')
            this.scene.start('GameOver');
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
        this.addMountains()
        this.platformGroup.setDepth(1)
    }
}

//game over
class gameOver extends Phaser.Scene{

    constructor(){
        super("GameOver");
    }
    preload() {
        this.load.image("sad", "assets/mbappe_game_over.jpg");
    }
    create() {
        //console.log('%c GameOver ', 'background: green; color: white; display: block;');

        this.add.sprite(game.config.width / 2, 200, 'sad');

        this.add.text(game.config.width / 2 - 200, game.config.height / 2 + 150, 'Vous avez perdu - Cliquez pour revenir au menu', { font: '16px Courier', fill: '#00ff00' });

        this.input.once('pointerup', function (event) {

            this.scene.start('MainMenu');

        }, this);
        //console.log('perdu')
    }

};

//win
class gameWin extends Phaser.Scene{

    constructor(){
        super("GameWin");
    }
    preload() {
        this.load.image("content", "assets/mbappe_content.jpg");
    }
    create() {
        //console.log('%c GameOver ', 'background: green; color: white; display: block;');

        this.add.sprite(game.config.width / 2, 200, 'content');

        this.add.text(game.config.width / 2 - 200, game.config.height / 2 + 150, 'Vous avez gagné', { font: '16px Courier', fill: '#00ff00' });

        this.input.once('pointerup', function (event) {

            this.scene.start('MainMenu');

        }, this);
        console.log('gagné');
        //console.log('perdu')
    }

};

//menu
class mainMenu extends Phaser.Scene {
    constructor() {
        super("MainMenu")
    }
    preload() {
        this.load.image("coupe", "assets/ballon.jpg");
        this.load.image("logo", "assets/UEFA_Euro_2020_logo.png");
        this.load.image("text", "assets/text_start.png");
    }
    create() {
        //var imgTop = this.add.image(0, 0, 'coupe')
        this.add.sprite(80, 70, "coupe");
        this.add.sprite(game.config.width / 2, game.config.height / 2, "logo");
        //s.rotation = 0

        var textBg = this.add.image(0, 0, 'text');
        var container = this.add.container(game.config.width / 2, game.config.height / 2, [textBg]);

        textBg.setInteractive()

        textBg.once('pointerup', function() {
            this.scene.start('PlayGame');
        }, this)
        console.log('menu');
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

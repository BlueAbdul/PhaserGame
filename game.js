let game;

// global game options
let gameOptions = {
    platformStartSpeed: 1500,
    spawnRange: [10, 50],
    platformSizeRange: [50, 50],
    playerGravity: 1900,
    jumpForce: 700,
    playerStartPosition: 200,
    jumps: 2,
    renaultPercent: 5,
    coinPercent : 100
    
}

window.onload = function() {

    // object containing configuration options
    let gameConfig = {
        type: Phaser.AUTO,
        width: 1334,
        height: 750,
        scene: playGame,
        backgroundColor: 0x444444,

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
        this.load.image("platform", "ezaplatform.png");
        this.load.spritesheet("renault", "sprite-renault.png",{
            frameWidth: 100,
            frameHeight: 20
        });
        this.load.spritesheet("player", "sprite-golf.png", {
            frameWidth: 289,
            frameHeight: 103
        });
        this.load.spritesheet("coin", "coin.png", {
            frameWidth: 20,
            frameHeight: 20
        });
        

        
        // this.load.spritesheet('player', 'golf.png', { frameWidth: 600, frameHeight: 223 });
    }
    create(){
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
                    alert('gagné')
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


        if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            this.player.anims.play('turn')
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

    }
};
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

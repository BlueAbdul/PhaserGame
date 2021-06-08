if(Phaser.Math.Between(1, 100) <= gameOptions.renaultPercent){
    if(this.renaultPool.getLength()){
        let renault = this.renaultPool.getFirst();
        renault.x = posX - platformWidth / 2 + Phaser.Math.Between(1, platformWidth);
        renault.y = posY - 46;
        renault.alpha = 1;
        renault.active = true;
        renault.visible = true;
        this.renaultPool.remove(renault);
    }
    else{
        let renault = this.physics.add.sprite(posX - platformWidth / 2 + Phaser.Math.Between(1, platformWidth), posY - 46, "renault");
        renault.setImmovable(true);
        renault.setVelocityX(platform.body.velocity.x);
        renault.setSize(8, 2, true)
        renault.setDepth(2);
        this.renaultGroup.add(renault);
    } }
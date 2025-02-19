
import { ethers } from "hardhat";


async function main() {
    
    const bottleGame = await ethers.getContractFactory("BottleGame");
    const bottle_game = await bottleGame.deploy();
    await bottle_game.waitForDeployment();
    console.log("Bottlegame deployed to:", await bottle_game.getAddress());

   
    
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 

    
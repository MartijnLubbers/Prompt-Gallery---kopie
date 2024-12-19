Stap 1: Installer Node.js en NPM
	sudo apt update
	sudo apt upgrade -y
	curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
	sudo apt install -y nodejs
	node -v
	npm -v


Stap 2: Map aanmaken
	mkdir node_project
	cd node_project
	
	
Stap 3: Cone Git project
	git clone https://github.com/MartijnLubbers/Prompt-Gallery---kopie
	
	
Stap 4: Installeer dependencies
	cd Prompt-Gallery---kopie

	cd Backend
	npm install

	cd frontend
	npm install


Stap 5: Start Services
	cd Backend
	node server.js

	cd frontend
	npm start
	
	
	
Probleem oplossen
1. Verwijder en installeer node_modules opnieuw
Soms zijn de dependencies beschadigd of niet volledig geïnstalleerd. Je kunt ze verwijderen en opnieuw installeren:


	rm -rf node_modules package-lock.json
	npm install
	npm start

2. Controleer of de debug module correct is geïnstalleerd
Het kan zijn dat de debug module niet goed is geïnstalleerd in het project. Installeer deze handmatig:

	npm install debug
	npm start
class Deadend {
    constructor(prevId,floor){
        this.id = generateId();
        this.prevId = prevId; // tracks which room you came from
        this.floor = floor;
    }

    navigate(roomId) {
        /* check if room is valid exit
            if so, set current room to new room
                do cleanup and redrawing*/
        if (currentLight <= 0) {
            checkLog.innerHTML += `<p>Not enough light to continue by. Play again?</p>`;
            navPrev.disabled = true;
            checkBtn.disabled = true;
            info.innerHTML = infoString();
            //TODO create a generic function that kicks in when light hits 0 (lightCheck that functions as a document listener?)
            return;
        }

        if (roomId === roomList[0][1].id) { // first, check for victory
            currentRoom = roomList[0][1];
            document.querySelector('.cave-buttons').replaceChildren(); //Clears out cave buttons
            navPrev.disabled = true;
            checkBtn.disabled = true;
            checkLog.innerHTML += `You have escaped the caves! Congratulations!`;
            checkLog.scrollTop = checkLog.scrollHeight; // scrolls to bottom

            info.innerHTML = `<p>Floor: out of the caves!</p>`;
            lights.innerHTML = `<p>Light: the brightness of the sun</p>`;
            roomName.innerHTML = `The Surface`;

            return;
        }

        if (this.prevId === roomId) { // handler for exit to previous floor
            const destination = roomList[currentRoom.floor - 1].find(x => x.id === roomId);
            currentRoom = destination;
            navRedraw(currentRoom);
        } else if (this.exits.includes(roomId)) { // handler for exit to the next floor
            const destination = roomList[currentRoom.floor + 1].find(x => x.id === roomId);
            currentRoom = destination;
            navRedraw(currentRoom);
        } else { // catchall
            console.error('Unable to resolve destination!');
        } // Deadends don't have exits, but the first clause of the method and the error clause should catch everything

        info.innerHTML = infoString();
        lights.innerHTML = infoString('light');
        roomName.innerHTML = infoString('name');

        if (currentRoom.prevId === null) { // Allows navigation back if there is a previous room
            navPrev.disabled = true;
        } else {
            navPrev.disabled = false;
        }
    }

    goPrev() {
        if (currentRoom.prevId === null) {
            return; // Prevent navigation to undefined previous rooms aka room zero which has null prevId
        }

        currentLight -= 2;
        if (currentLight <= 0) { //TODO create generic function to call when light hits 0 (deliver defeat message, create button to reset)
            checkLog.innerHTML += `<p>You run out of light. Play again?</p>`;
            checkLog.scrollTop = checkLog.scrollHeight; // scrolls to bottom

            info.innerHTML = infoString(); //call infoString to reset text boxes
            lights.innerHTML = '<p>No light.</p>';
            navPrev.disabled = true;
            checkBtn.disabled = true;
            return;
        }

        this.navigate(this.prevId);
    }

    exitCheck() { // returns number of available exits out of a total of three "slots" (used for deadend spawning)
        if (this.exits) { // catch deadends here
            return 3 - this.exits.length;
        }
        else {
            return 0; // deadends default to 0 exits, to skip attempts to push to exits array
        }
    }

    peek() { // checks for exits, used when you spend light
        if (!this.exits) {
            console.log('No exits!');
            return `<p>All exits are dead ends.</p>`;
        }

        if (currentRoom.id === 0) {
            return `<p>On the lowest floor, you can't tell which tunnels might have exits. No light spent.</p>`;
        }

        let exitCount = 0;
        let exitString = `<p>There are further exits in `;

        for (const exit of this.exits) {
            if (this.floor === 3) { // exception handling for penultimate floor, TODO replace with dynamic coding
                if (roomList[0].find(x => x.id === exit)) { // Verifies whether exit is located on floor 0; if so, victory room is there
                    exitCount++;
                    exitString = `<p>Exit found in Room <span class="cave-glyphs">${exit}</span>...you're so close  `; // pad by 2 for the slice after the loop
                }

                continue; // skip the rest if on penultimate floor
            }

            const exitRoom = roomList[this.floor + 1].find(x => x.id === exit); // Assigns rooms that correspond to exit IDs
            if (exitRoom.exits) {
                exitCount++;
                exitString += `Room <span class="cave-glyphs">${exitRoom.id}</span>, `;
            }
        }

        exitString = exitString.slice(0,-2); // removes the comma and space generated by the final entry.
        exitString += '.';

        if (exitCount === 0) {
            exitString = `<p>No good exits found from Room <span class="cave-glyphs">${currentRoom.id}</span>. You should go back, save your light.`;
        }

        exitString += `</p>`;
        return exitString;
    }
}

class Room extends Deadend { // Room class inherits all methods but also has exits
    constructor(prevId,exits,floor) {
        super(prevId,floor);
        this.exits = exits; // pass as array
    }
}

function roomInit () {
    roomList.length = 0; // empty roomList; this is the most logical place to do it
    const roomZero = new Room(null,[],0); // set origin room
    roomZero.id = 0; // explicitly set roomZero to 0
    const floor1 = []; // Start by creating arrays
    const floor2 = [];
    const floor3 = []; // WISHLIST figure out way to iterate new variable assignments so that we can pass a variable to roomInit to say how many floors to make

    for (i=1; i<=6; i++) { // generating six rooms for floor 1
        const newRoom = new Room(0,[],1);
        floor1.push(newRoom);
        roomZero.exits.push(newRoom.id); // room zero has an exit for each of these rooms
    }

    for (i=1; i<=3; i++) { // generating three exit rooms for floor 2
        const prevRoom = randArray(floor1); //floor1 is an array of objects, so this returns a reference to a Room object
        const newRoom = new Room(prevRoom.id,[],2);
        prevRoom.exits.push(newRoom.id); // push an exit to the room into a random room on floor 1
        floor2.push(newRoom);
    }

    for (i=1; i<=2; i++) { // generating two exit rooms for floor 3
        const prevRoom = randArray(floor2);
        const newRoom = new Room(prevRoom.id,[],3);
        prevRoom.exits.push(newRoom.id); // push an exit to the room into a random room on floor 2
        floor3.push(newRoom);
    }

    const finalExit = randArray(floor3); // code that creates the final room and sets exits correctly
    const finalId = generateId();
    finalExit.exits.push(finalId);
    const roomVictory = new Room(finalExit.id,[],4);
    roomVictory.id = finalId;
    const floorSpecial = [roomZero,roomVictory];

    roomList.push(floorSpecial); //store all rooms in array
    roomList.push(floor1);
    roomList.push(floor2);
    roomList.push(floor3);
    roomList.push([]); // empty container to spawn the final floor deadends into

    for (const floor of roomList) { // loop through all array floors to generate filler deadends
        if (floor[0].id === 0) { // skip the floor that contains room 0, which also contains the victory room
            continue;
        }

        for (const room of floor) {
            const floorHolder = []; // container so that the while loop finishes reading a floor before pushing to it

            while (room.exitCheck() > 0) {
                const dead = new Deadend(room.id,room.floor+1);
                roomList[room.floor+1].push(dead);
                room.exits.push(dead.id);
            }
            for (const room of floorHolder) {
                floor.push(room); // now that the loop is over, push rooms to the actual floor
            }
        }
    }

    if(!roomListVerify()) { roomInit() } //redo the rooms if there's a duplicate
}

function navRedraw(navRoom) {
    const caveNav = document.querySelector('.cave-buttons');
    caveNav.replaceChildren(); // clears the previous buttons out

    if (!navRoom.exits) { // deadend handler
        const navText = document.createElement('p');
        navText.innerHTML = '<p>There are no exits. Go back and try again.</p>'
        caveNav.appendChild(navText);
        return;
    }

    for (const exit of navRoom.exits) { // Rebuild nav buttons
        const exitBtn = document.createElement('button');
        exitBtn.classList.add('exit-btn');
        exitBtn.id = `exit-${exit}`;
        exitBtn.innerHTML = exit;
        exitBtn.addEventListener('click', () => {
            navRoom.navigate(exit);
        });
        caveNav.appendChild(exitBtn);
    }
}

/* Utility functions */
function randArray(arr) {
    return arr[Math.floor(arr.length * Math.random())]; // staple function to return one random value from an array
}

function generateId() {
    return Math.random().toString(36).substr(2, 4); // Could be better, could be worse, should be fine for our needs; very small number of rooms need to be created, we have a function to check for name collisions
}

function infoString(query = 'floor') { // creates and returns string literal for the infobox text, this lets us easily change it
    if (currentLight <= 0) {
        return `<p>No light remaining. All is darkness.</p>`;
    }

    let infobox;

    switch(query) { // Multiuse function will return different HTML for different stats
        case 'floor':
            infobox = `<p>Floor: ${currentRoom.floor}</p>`;
            break;
        case 'light':
            infobox = `<p>Light: ${currentLight}</p>`;
            break;
        case 'name':
            infobox = `Room <span class="cave-glyphs">${currentRoom.id}</span>`;
            break;
    }

    return infobox;
}

function roomListVerify() {
    let roomsValid = true;
    for (const floor of roomList) {
        for (const room of floor) { // outer loop to loop through the check for all rooms
            let duplicates = 0;
            for (const floorTest of roomList) { // inner loop to test against all other rooms
                for (const roomTest of floorTest) {
                    if (roomTest.id === room.id) {
                        duplicates++;
                    }
                }
            }

            if (duplicates > 1) { console.error(`Duplicate detected on floor ${room.floor}!`); roomsValid = false; } // logging duplicates found on each floor
        }
    }
    return roomsValid;
}

function cavesReset() {
    roomInit();
    currentLight = 15;
    currentRoom = roomList[0][0];
    navRedraw(currentRoom);

    info.innerHTML = infoString('floor');
    lights.innerHTML = infoString('light');
    roomName.innerHTML = infoString('name');
    checkLog.innerHTML = '';
}

// Initial setup
const roomList = []; // set up array to push rooms into
let currentLight; // tracker for player light level
let currentRoom; // currentRoom holds the room we're currently in

const info = document.querySelector('.floor-info'); // Select components of the HUD
const lights = document.querySelector('.lights-hud');
const roomName = document.querySelector('.room-name');
const checkLog = document.querySelector('.check-log');

cavesReset(); // Initialization function

const navPrev = document.querySelector("#previous");
navPrev.disabled = true;
navPrev.addEventListener('click', () => {
    currentRoom.goPrev();
});

const checkBtn = document.querySelector('button#check');
checkBtn.addEventListener('click', () => {
    if (currentRoom.id != 0) {
        currentLight -= 2;
        lights.innerHTML = infoString('light');
    }

    checkLog.innerHTML += currentRoom.peek();
    checkLog.scrollTop = checkLog.scrollHeight; // scrolls to bottom
});

const resetBtn = document.querySelector('#reset-btn');
resetBtn.addEventListener('click', cavesReset);
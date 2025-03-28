LoadEverything().then(() => {
  let p1Score = 100; // Variable to hold the P1 score before an update
  let p2Score = 100; // Variable to hold the P2 score before an update
  let newP1Score = 0; // Variable to hold the P1 score after an update
  let newP2Score = 0; // Variable to hold the P2 score after an update
  let savedGameArray = new Array(); // Array to save which player won which game
  let player1; // P1 object before an update takes place
  let player2; // P2 object before an update takes place
  let newPlayer1; // P1 object after an update takes place
  let newPlayer2; // P2 object after an update takes place

  Start = async () => {
  };

  Update = async (event) => {
    let data = event.data;

    for (const [t, team] of [
      data.score[window.scoreboardNumber].team["1"],
      data.score[window.scoreboardNumber].team["2"],
    ].entries()) {
      for (const [p, player] of [team.player["1"]].entries()) {
        if (player) {
          SetInnerHtml(
            $(`.p${t + 1} .name`),
            `
            ${player.name ? await Transcript(player.name) : ""}
            ${team.losers ? "(L)" : ""}
          </span>
          `
          );
          SetInnerHtml($(`.p${t + 1} .score`), String(team.score));
          checkSwap();
          ({ savedGameArray, newP1Score, newP2Score, p1Score, p2Score } =
            updateGameArray(
              savedGameArray,
              newP1Score,
              newP2Score,
              p1Score,
              p2Score
            ));
          renderHTML();
        }
        if (team.color) {
          document
            .querySelector(":root")
            .style.setProperty(`--p${t + 1}-score-bg-color`, team.color);
        }
      }
    }
  };

  /**
   * Updates the savedGameArray based on the update on the players' scores.
   * @param savedGameArray an array holding the results of the games, 1 for P1's win, 2 for P2's win
   * @param newP1Score a variable to hold the current P1 score
   * @param newP2Score a variable to hold the current P2 score
   * @param p1Score a variable that holds the previous P1 score
   * @param p2Score a variable that holds the previous P2 score
   * @returns all the updated variables
   */
  function updateGameArray(
    savedGameArray,
    newP1Score,
    newP2Score,
    p1Score,
    p2Score
  ) {
    let gameNum = 0; // Variable to store which game we are at
    let gameArray = savedGameArray; // Array to hold game winner data

    // Retrieve the JSON string from local storage
    const retrievedJsonString = localStorage.getItem("output");

    // Parse the JSON string back to an array
    const retrievedArray = JSON.parse(retrievedJsonString);

    if (retrievedArray) {
      gameArray = retrievedArray;
    }

    // Do a run-through to get P1 score and P2 score to see which game we are at.
    [
      data.score[window.scoreboardNumber].team["1"],
      data.score[window.scoreboardNumber].team["2"],
    ].forEach((team, t) => {
      [team.player["1"]].forEach((player, p) => {
        if (player) {
          // If we are looking at P1
          if (t == 0) {
            newP1Score = team.score; // Get P1 score
          }
          // If we are looking at P2
          if (t == 1) {
            newP2Score = team.score; // Get P2 score
          }
        }
      });
      gameNum = newP1Score + newP2Score; // Add P1 score and P2 score to see which game we are at
    });

    // Clear all the boxes when P1 score + P2 score is 0.
    if (gameNum == 0) {
      gameArray = new Array(); // Clear the array
    }

    // If the score of P1 increased, fill in the array with 1's equal to the increase amount.
    if (newP1Score > p1Score) {
      for (let i = 0; i < newP1Score - p1Score; i++) {
        gameArray[gameNum - (newP1Score - p1Score) + i] = 1;
      }
    }

    // If the score of P2 increased, fill in the array with 2's equal to the increase amount.
    if (newP2Score > p2Score) {
      for (let i = 0; i < newP2Score - p2Score; i++) {
        gameArray[gameNum - (newP2Score - p2Score) + i] = 2;
      }
    }

    // If the score of P1 decreased, locate the index of the most recent win and remove it from the array using splice.
    // Repeat as many times as the decrease amount.
    if (newP1Score < p1Score) {
      // p1Score was initially set to 100 so this does not execute on the first run-through
      if (p1Score < 100) {
        for (let i = 0; i < p1Score - newP1Score; i++) {
          let index = -1;
          for (let j = 0; j < gameArray.length; j++) {
            if (gameArray[j] == 1) {
              index = j; // Locate the index of the most recent win
            }
          }
          gameArray.splice(index, 1); // Remove one game at a time
        }
      }
    }

    // If the score of P2 decreased, locate the index of the most recent win and remove it from the array using splice.
    // Repeat as many times as the decrease amount.
    if (newP2Score < p2Score) {
      // p2Score was initially set to 100 so this does not execute on the first run-through
      if (p2Score < 100) {
        for (let i = 0; i < p2Score - newP2Score; i++) {
          let index = -1;
          for (let j = 0; j < gameArray.length; j++) {
            if (gameArray[j] == 2) {
              index = j; // Locate the index of the most recent win
            }
          }
          gameArray.splice(index, 1); // Remove one game at a time
        }
      }
    }
    p1Score = newP1Score; // Update p1Score to detect change later
    p2Score = newP2Score; // Update p2Score to detect change later

    savedGameArray = gameArray; // Update the savedGameArray to hold the current results

    // Convert the array to a JSON string
    const jsonString = JSON.stringify(savedGameArray);

    // Store the JSON string in local storage
    localStorage.setItem("output", jsonString);

    return { savedGameArray, newP1Score, newP2Score, p1Score, p2Score }; // Return all the updated variables
  }

  /**
   * Checks to see if a swap took place. If it did, then the colors of the boxes are flipped.
   */
  function checkSwap() {
    [
      data.score[window.scoreboardNumber].team["1"],
      data.score[window.scoreboardNumber].team["2"],
    ].forEach((team, t) => {
      [team.player["1"]].forEach((player, p) => {
        if (player) {
          if (t == 0) {
            newPlayer1 = player;
          }
          if (t == 1) {
            newPlayer2 = player;
          }
        }
      });
    });

    // If a swap was detected
    if (
      player1 !== undefined &&
      player2 !== undefined &&
      compareObjects(player2, newPlayer1) &&
      compareObjects(player1, newPlayer2)
    ) {
      // Change player 1's win to player 2's win and vice versa
      for (let i = 0; i < savedGameArray.length; i++) {
        if (savedGameArray[i] == 1) {
          savedGameArray[i] = 2;
        } else if (savedGameArray[i] == 2) {
          savedGameArray[i] = 1;
        }
      }

      // Convert the array to a JSON string
      const jsonString = JSON.stringify(savedGameArray);

      // Store the JSON string in local storage
      localStorage.setItem("output", jsonString);

      // Swap score history as well
      [p1Score, p2Score] = [p2Score, p1Score];
    }

    // After a swap, player data are saved to detect the next swap
    player1 = newPlayer1;
    player2 = newPlayer2;
  }

  function renderHTML() {

    let maruBatsuDivText = "";

    for (let i = 0; i < savedGameArray.length; i++) {
        // Determine the symbols based on the value in the array
        const symbols = savedGameArray[i] === 1 ? ['maru', 'batsu'] : ['batsu', 'maru'];

        // Append the generated HTML to maruBatsuDivText
        maruBatsuDivText += `
        <div class="game${i} game_column">
            <div class="p1 marubatsu_container">
                <div class="${symbols[0]} symbol"></div>
            </div>
            <div class="p2 marubatsu_container">
                <div class="${symbols[1]} symbol"></div>
            </div>
        </div>`;
    }
    SetInnerHtml($('.game_column_container'), maruBatsuDivText);
  }

  /**
   * Checks to see whether the properties and their values of obj1 are the same as those of obj2
   * Created this function with the help of ChatGPT, modified to make it recursive and fit the need of the overlay.
   * @param obj1 Object 1 to compare
   * @param obj2 Object 2 to compare
   * @returns boolean of whether the properties and their values of obj1 are the same as those of obj2
   */
  function compareObjects(obj1, obj2) {
    // Get the property names of obj1
    const obj1Keys = Object.keys(obj1).sort();

    // Loop through the properties of obj1
    for (let key of obj1Keys) {
      if (key !== "character" && key !== "mains" && key !== "id" && key !== "") {
        // Check if the property exists in obj2
        if (!obj2.hasOwnProperty(key)) {
          return false;
        }
        // Check if the values of the properties are the same
        // Check to see if there is an object inside the object
        if (typeof obj1[key] == "object" && obj1[key] && obj2[key]) {
          // If an inner object of obj1 is not equal to the inner object of obj2, then we return false to avoid any more comparisons
          if (!compareObjects(obj1[key], obj2[key])) return false;
          // If the primitive types are not equal to each other, then we return false here as well
        } else if (obj1[key] !== obj2[key]) {
          return false;
        }
      }
    }
    // If all properties and their values are the same, return true
    return true;
  }
});
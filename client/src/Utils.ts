export function secondsToHHMMSS(seconds: number) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secondsLeft = seconds % 60;

    // Use a template literal for easier string construction
    let timeString = "";

    if (hours > 0) {
        timeString += `${hours}:`;
    }

    if (minutes > 0 || hours > 0) {
        timeString += `${minutes.toString().padStart(2, "0")}:`;
    }

    timeString += secondsLeft.toString().padStart(2, "0");

    return timeString;
}
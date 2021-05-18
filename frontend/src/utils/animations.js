function buttonPulse() {
    let btn = document.getElementById("submitButton")
    btn.classList.add("button-primary-negative");
    setTimeout(function(){
        btn.classList.remove("button-primary-negative");
    }, 300);
}

export {
    buttonPulse
}
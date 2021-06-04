let outliers = {
    lowest: {},
    highest: {}
}
let average = '';
let relevantMembers = [];


function setOutliers(members) {
    relevantMembers = [ ...members.filter(checkNumber)];
    console.log(relevantMembers);
    if( relevantMembers.length ) {
        let lo = getLowest(relevantMembers);
        let hi = getHighest(relevantMembers);
        if(lo.estimation !== hi.estimation) {
            Object.assign(outliers, {lowest: lo, highest: hi});
        }
    }
}

function resetOutliers() {
    outliers.lowest = {};
    outliers.highest = {};
}

function getLowest(members) {
    return  members.reduce(function(prev, current) {
                return (parseInt(prev.estimation) < parseInt(current.estimation)) ? prev : current;
            });
}

function getHighest(members) {
    return  members.reduce(function(prev, current) {
                return (parseInt(prev.estimation) > parseInt(current.estimation)) ? prev : current;
            });
}

function checkNumber(member) {
    if( !isNaN(parseInt(member.estimation)) ) return member;
}

function setAverage(members) {
    let sum = 0;
    let count = 0;
    average = '';
    for(let i = 0; i < members.length; i++) {
        let estimation = members[i].estimation;
        if( estimation !== '' && estimation !== '?' && estimation !== 'coffee' ) {
            sum = sum + parseInt(members[i].estimation);
            count++;
        }
    }
    if(count !== 0) {
        sum = Math.round( (sum / count) * 100 ) / 100;
        average = sum.toString();
    }
}

function resetAverage() {
    average = '';
}

export {
    outliers,
    average,
    setOutliers,
    resetOutliers,
    setAverage,
    resetAverage
}
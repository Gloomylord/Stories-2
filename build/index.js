function solveLeaders(users, usersCommitsCount, sprint) {
    let leaders = {
        "alias": "leaders",
        "data": {
            "title": "Больше всего коммитов",
            "subtitle": sprint.name ? sprint.name : "",
            "emoji": "👑",
            "users": []
        }
    };

    leaders.data.users = Object.entries(usersCommitsCount)
        .sort(([id1, count1], [id2, count2]) => count2 - count1)
        .map(([userId, count]) => (
            {
                id: +userId,
                valueText: count + '',
                avatar: users[userId].avatar,
                name: users[userId].name,
            })
        );
    return leaders;
}

function solveVote(users, comments, sprint) {
    let usersLikesCount = {};
    let words = ["голос", "голоса", "голосов"];
    let vote = {
        "alias": "vote",
        "data": {
            "title": "Самый 🔎 внимательный разработчик",
            "subtitle": sprint.name ? sprint.name : "",
            "emoji": "🔎",
            "users": []
        }
    };

    Object.values(comments).forEach(({createdAt, author, likes}) => {
            if (sprint.startAt < createdAt && createdAt < sprint.finishAt) {
                usersLikesCount[author] = !usersLikesCount[author] ? likes.length :
                    usersLikesCount[author] += likes.length;
            }
        }
    );
    vote.data.users = Object.entries(usersLikesCount)
        .sort(([id1, count1], [id2, count2]) => count2 - count1)
        .map(([userId, count]) => {
            let obj = {id: +userId, valueText: count};
            obj.valueText = declOfNum(obj.valueText, words);
            obj.avatar = users[userId].avatar;
            obj.name = users[userId].name;
            return obj;
        });
    return vote;
}

function solveChart(leaders, sprints, sprint) {
    let chart = {
        "alias": "chart",
        "data": {
            "title": "Коммиты",
            "subtitle": sprint.name ? sprint.name : "",
            values: [],
            users: leaders.data.users,
        }
    };
    chart.data.values = Object.values(sprints)
        .sort((sprint1, sprint2) => sprint1.id - sprint2.id)
        .map(({id, name, count}) => {
            return (sprint.id === id) ? {title: id + "", hint: name, value: count, active: true} :
                {title: id + "", hint: name, value: count}
        });
    return chart;
}

function declOfNum(number1, words) {
    let number = (number1 < 0) ? -number1 : number1;
    return number1 + " " +
        words[(number % 100 > 4 && number % 100 < 20) ? 2 : [2, 0, 1, 1, 1, 2][(number % 10 < 5) ? number % 10 : 5]];
}

function solveDiagram(summaries, sprint, previousSprint) {
    let diagram = {
        "alias": "diagram",
        "data": {
            "title": "Размер коммитов",
            "totalText": 0,
            "differenceText": 0,
            "subtitle": sprint.name ? sprint.name : '',
            "categories": [
                {"title": "> 1001 строки", "valueText": 0, "differenceText": 0},
                {"title": "501 — 1000 строк", "valueText": 0, "differenceText": 0},
                {"title": "101 — 500 строк", "valueText": 0, "differenceText": 0},
                {"title": "1 — 100 строк", "valueText": 0, "differenceText": 0}
            ]
        }
    };
    let words = ["коммит", "коммита", "коммитов"];

    function solveCategories(sprint, value) {
        sprint.summaries.map((arr) => {
            return arr.reduce((res, id) => res + summaries[id].added + summaries[id].removed, 0)
        }).forEach((size) => {
            let i;
            diagram.data.totalText += (value > 0) ? 1 : 0;
            diagram.data.differenceText += value;
            if (size > 0 && size <= 100) {
                i = 3;
            } else if (size <= 500) {
                i = 2
            } else if (size < 1000) {
                i = 1
            } else if (size > 1000) {
                i = 0;
            }
            if (i !== undefined) {
                diagram.data.categories[i].valueText += (value > 0) ? 1 : 0;
                diagram.data.categories[i].differenceText += value;
            }
        });
    }

    if (sprint.summaries) solveCategories(sprint, 1);
    if (previousSprint.summaries) solveCategories(previousSprint, -1);

    diagram.data.totalText = declOfNum(diagram.data.totalText, words);
    diagram.data.differenceText = (diagram.data.differenceText > 0 ? '+':'')
        + diagram.data.differenceText + ' с прошлого спринта';
    diagram.data.categories = diagram.data.categories.map((obj) => {
        obj.valueText = declOfNum(obj.valueText, words);
        obj.differenceText = (obj.differenceText > 0 ? '+':'') + declOfNum(obj.differenceText, words);
        return obj;
    });
    return diagram;
}

function prepareData(entities, {sprintId}) {
    let usersCommitsCount = {};
    let sprints = {};
    let users = {};
    let commits = {};
    let comments = {};
    let summaries = {};
    let previousSprint = {};
    let sprint = {};
    let leaders;
    let activity = {
        "alias": "activity",
        "data": {
            "title": "Коммиты",
            "subtitle": '',
            "data": ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
                .reduce((res, day) => ({...res, [day]: Array(24).fill(0)}), {})
        }
    };
    let days = Object.keys(activity.data.data);

    entities.forEach((value) => {
        if (value.type === "Sprint") {
            if (value.id === sprintId) sprint = value;
            if (value.id === sprintId - 1) previousSprint = value;
            if (!sprints[value.id]) sprints[value.id] = {...value, count: 0};
        }
        if (value.type === "Commit") {
            if (!commits[value.id]) commits[value.id] = value;
        }
        if (value.type === "Comment") {
            if (!comments[value.id]) comments[value.id] = value;
        }
        if (value.type === "User") {
            if (!users[value.id]) users[value.id] = value;
        }
        if (value.type === "Summary") {
            if (!summaries[value.id]) summaries[value.id] = value;
        }
    });

    Object.values(commits).forEach(({timestamp, author, summaries}) => {
        if (sprint.startAt <= timestamp && timestamp < sprint.finishAt) {
            usersCommitsCount[author] = !usersCommitsCount[author] ? 1 :
                usersCommitsCount[author] + 1;
            sprint.summaries = (!sprint.summaries) ? [summaries] : sprint.summaries.concat([summaries]);
            let j = new Date(timestamp).getDay();
            let i = (new Date(timestamp).getHours() - new Date(sprint.startAt).getHours()) % 24;
            activity.data.data[days[j]][i]++;
        }
        if (previousSprint.startAt <= timestamp && timestamp < previousSprint.finishAt) {
            previousSprint.summaries = (!previousSprint.summaries) ? [summaries]
                : previousSprint.summaries.concat([summaries]);
        }
        Object.values(sprints).forEach((sprint) => {
            if (sprint.startAt <= timestamp && timestamp < sprint.finishAt) sprint.count++;
        });
    });
    activity.data.subtitle = sprint.name ? sprint.name : '';
    leaders = solveLeaders(users, usersCommitsCount, sprint);
    return [
        leaders,
        solveVote(users, comments, sprint),
        solveChart(leaders, sprints, sprint),
        solveDiagram(summaries, sprint, previousSprint),
        activity
    ];
}

module.exports = {prepareData};

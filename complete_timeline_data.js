// Complete D3 Timeline Dataset for Working Mom Comparison
// Format: Array with two main sections - "With Kid" vs "Without Kid"

const timelineData = [
  {
    "label": "With Kid",
    "times": [
      {
        "starting_time": 1703998800000,
        "ending_time": 1704014100000,
        "activity": "Sleep"
      },
      {
        "starting_time": 1704014100000,
        "ending_time": 1704015000000,
        "activity": "Alarm goes off"
      },
      {
        "starting_time": 1704015000000,
        "ending_time": 1704015900000,
        "activity": "Get up, brush teeth, fix hair, get dressed, start coffee maker."
      },
      {
        "starting_time": 1704015900000,
        "ending_time": 1704016800000,
        "activity": "Leave for gym"
      },
      {
        "starting_time": 1704016800000,
        "ending_time": 1704021300000,
        "activity": "Work out"
      },
      {
        "starting_time": 1704021300000,
        "ending_time": 1704022200000,
        "activity": "Arrive at home. Have a cup of coffee, check work e-mails and calendar for the day"
      },
      {
        "starting_time": 1704022200000,
        "ending_time": 1704024000000,
        "activity": "Shower and begin getting ready."
      },
      {
        "starting_time": 1704024000000,
        "ending_time": 1704026700000,
        "activity": "Wake up son."
      },
      {
        "starting_time": 1704026700000,
        "ending_time": 1704028500000,
        "activity": "Take son to school"
      },
      {
        "starting_time": 1704028500000,
        "ending_time": 1704029400000,
        "activity": "head to work event"
      },
      {
        "starting_time": 1704029400000,
        "ending_time": 1704034800000,
        "activity": "Work event"
      },
      {
        "starting_time": 1704034800000,
        "ending_time": 1704038400000,
        "activity": "Take virtual meeting in car while parked at the office she was at for the work event."
      },
      {
        "starting_time": 1704038400000,
        "ending_time": 1704040200000,
        "activity": "Commute to 11:30 meeting."
      },
      {
        "starting_time": 1704040200000,
        "ending_time": 1704043800000,
        "activity": "Off site meeting."
      },
      {
        "starting_time": 1704043800000,
        "ending_time": 1704047400000,
        "activity": "Get home from being out, start a load of laundry, make lunch and eat."
      },
      {
        "starting_time": 1704047400000,
        "ending_time": 1704052800000,
        "activity": "Catch up on e-mails I missed while out and about all morning, return work phone calls."
      },
      {
        "starting_time": 1704052800000,
        "ending_time": 1704054600000,
        "activity": "Pick up son from school"
      },
      {
        "starting_time": 1704054600000,
        "ending_time": 1704059100000,
        "activity": "Start on dinner, make sure son is doing homework and practicing his instrument"
      },
      {
        "starting_time": 1704059100000,
        "ending_time": 1704061800000,
        "activity": "Serve, eat, clean up dinner."
      },
      {
        "starting_time": 1704061800000,
        "ending_time": 1704063600000,
        "activity": "Take 30 minutes to herself."
      },
      {
        "starting_time": 1704063600000,
        "ending_time": 1704065400000,
        "activity": "Take son to band practice and drum lessons"
      },
      {
        "starting_time": 1704065400000,
        "ending_time": 1704070800000,
        "activity": "Grocery shop at Costco, Aldi, and Cub Foods"
      },
      {
        "starting_time": 1704070800000,
        "ending_time": 1704072600000,
        "activity": "Pick up son"
      },
      {
        "starting_time": 1704072600000,
        "ending_time": 1704073500000,
        "activity": "Unload groceries, wash and portion out fruit."
      },
      {
        "starting_time": 1704073500000,
        "ending_time": 1704075300000,
        "activity": "Make sure son is in the shower and getting ready for bed."
      },
      {
        "starting_time": 1704075300000,
        "ending_time": 1704076200000,
        "activity": "After saying good night to son, wash face and get ready for bed myself."
      },
      {
        "starting_time": 1704076200000,
        "ending_time": 1704085200000,
        "activity": "Sleep"
      }
    ]
  },
  {
    "label": "Without Kid",
    "times": [
      {
        "starting_time": 1704013200000,
        "ending_time": 1704022200000,
        "activity": "Sleep"
      },
      {
        "starting_time": 1704022200000,
        "ending_time": 1704023100000,
        "activity": "Wake up and go to gym"
      },
      {
        "starting_time": 1704023100000,
        "ending_time": 1704026700000,
        "activity": "Gym workout"
      },
      {
        "starting_time": 1704026700000,
        "ending_time": 1704027600000,
        "activity": "Shower and get ready"
      },
      {
        "starting_time": 1704027600000,
        "ending_time": 1704028500000,
        "activity": "Get ready for work"
      },
      {
        "starting_time": 1704028500000,
        "ending_time": 1704029400000,
        "activity": "Travel to work"
      },
      {
        "starting_time": 1704029400000,
        "ending_time": 1704030300000,
        "activity": "Work event"
      },
      {
        "starting_time": 1704034800000,
        "ending_time": 1704035700000,
        "activity": "Virtual meeting"
      },
      {
        "starting_time": 1704043800000,
        "ending_time": 1704044700000,
        "activity": "No dinner prep needed \"I wouldn't care about prepping dinner tonight\""
      },
      {
        "starting_time": 1704044700000,
        "ending_time": 1704045600000,
        "activity": "Continue work day"
      },
      {
        "starting_time": 1704045600000,
        "ending_time": 1704046500000,
        "activity": "Office work"
      },
      {
        "starting_time": 1704052800000,
        "ending_time": 1704053700000,
        "activity": "Negotiations meeting"
      },
      {
        "starting_time": 1704060000000,
        "ending_time": 1704060900000,
        "activity": "Travel to school board meeting"
      },
      {
        "starting_time": 1704061800000,
        "ending_time": 1704062700000,
        "activity": "School board meeting"
      },
      {
        "starting_time": 1704072600000,
        "ending_time": 1704073500000,
        "activity": "Return home - relaxation time-\"I'm home, you know, I'm just gonna go be lazy on the couch to read a book\""
      },
      {
        "starting_time": 1704073500000,
        "ending_time": 1704074400000,
        "activity": "Leisure time-\"much more relaxed\""
      },
      {
        "starting_time": 1704078000000,
        "ending_time": 1704078900000,
        "activity": "Leisure time- No homework checking, no bedtime routine"
      },
      {
        "starting_time": 1704082500000,
        "ending_time": 1704083400000,
        "activity": "\"probably go to sleep at 10, 11, maybe even midnight\""
      }
    ]
  }
];

// Usage in D3:
// This data structure is ready for D3 timeline visualizations
// Each timeline has a label ("With Kid" vs "Without Kid") 
// and an array of time periods with start/end timestamps

// Example D3 usage:
/*
const svg = d3.select("svg");
const timeline = d3.scaleTime()
  .domain([d3.min(timelineData, d => d3.min(d.times, t => t.starting_time)),
           d3.max(timelineData, d => d3.max(d.times, t => t.ending_time))])
  .range([0, width]);

timelineData.forEach((person, personIndex) => {
  person.times.forEach(timeRange => {
    svg.append("rect")
      .attr("x", timeline(timeRange.starting_time))
      .attr("y", personIndex * 50)
      .attr("width", timeline(timeRange.ending_time) - timeline(timeRange.starting_time))
      .attr("height", 40)
      .attr("fill", personIndex === 0 ? "#ff6b6b" : "#4ecdc4");
  });
});
*/
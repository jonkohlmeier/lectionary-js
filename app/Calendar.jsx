import * as React from "react";
import PropTypes from "prop-types";
import { DateTime } from "luxon";
import classNames from "classnames";
import { Link } from "react-router-dom";

import { CalendarBuilder } from "../lib/CalendarBuilder";
import { KeyLoader } from "../lib/KeyLoader";
import { findColor, findProperByType, hasReadings } from "../lib/utils";

import lectionary from "../data/lsb-1yr.json";
import festivals from "../data/lsb-festivals.json";
import daily from "../data/lsb-daily.json";
import commemorations from "../data/lsb-commemorations.json";

const loader = new KeyLoader({ lectionary, festivals, daily, commemorations });

export default class Calendar extends React.Component {
  componentDidMount() {
    this.build();
  }

  getYearAndMonthLabel({ year, month }) {
    return DateTime.fromObject({ year, month, day: 1 }).toFormat("MMMM y");
  }

  getYearAndMonth() {
    return {
      year: parseInt(this.props.match.params.year),
      month: parseInt(this.props.match.params.month),
    };
  }

  getNextMonth() {
    const { year, month } = this.getYearAndMonth();

    if (month === 12) {
      return { year: year + 1, month: "01" };
    } else {
      return { year, month: this.paddNumber(month + 1) };
    }
  }

  getLastMonth() {
    const { year, month } = this.getYearAndMonth();

    if (month === 1) {
      return { year: year - 1, month: 12 };
    } else {
      return { year, month: this.paddNumber(month - 1) };
    }
  }

  paddNumber(v) {
    if (v < 10) {
      return `0${v}`;
    } else {
      return `${v}`;
    }
  }

  build() {
    const { year, month } = this.getYearAndMonth();

    window.document.title = `${this.getYearAndMonthLabel({
      year,
      month,
    })} · Sanctus.org`;

    const builder = new CalendarBuilder(year, month);
    return builder.build(loader.load);
  }

  navigateToDay = (day) => {
    const { year, month } = this.getYearAndMonth();
    this.props.history.push(`/${year}/${month}/${day}/`);
  };

  renderDay(day, weekDay) {
    const color =
      findColor(
        // Don't let festivals trump Sundays
        day?.date.weekday === 7 ? null : day?.propers.festivals,
        day?.propers.lectionary,
        day?.sunday?.propers.lectionary
      )?.toLowerCase() ?? "none";
    const classes = classNames({
      [`highlight-${color}`]: color,
      today: day && day.date && DateTime.local().hasSame(day.date, "day"),
    });

    return (
      <td
        className={classes}
        key={weekDay}
        onClick={() => this.navigateToDay(day.date.day)}
      >
        {day && day.date && (
          <div>
            <h3>{day.date.day}</h3>
            {[day.propers.lectionary, day.propers.festivals]
              .filter((p) => p.length > 0 && hasReadings(p))
              .map((propers, i) => (
                <div key={i}>
                  <h4>{findProperByType(propers, 0)?.text}</h4>
                  <div>Old Test: {findProperByType(propers, 19)?.text}</div>
                  <div>Epistle: {findProperByType(propers, 1)?.text}</div>
                  <div>Gospel: {findProperByType(propers, 2)?.text}</div>
                  <br />
                </div>
              ))}
            {findProperByType(day.propers.commemorations, 37) && (
              <h5>{findProperByType(day.propers.commemorations, 37)?.text}</h5>
            )}
            <div>{findProperByType(day.propers.daily, 38)?.text}</div>
            <div>{findProperByType(day.propers.daily, 39)?.text}</div>
          </div>
        )}
      </td>
    );
  }

  render() {
    const { year, month } = this.getYearAndMonth();
    const grid = this.build();

    if (!grid) {
      return <div />;
    }

    return (
      <div id="calendar">
        <nav>
          <Link to={`/${Object.values(this.getLastMonth()).join("/")}/`}>
            &laquo; {this.getYearAndMonthLabel(this.getLastMonth())}
          </Link>
          <h2>
            {this.getYearAndMonthLabel({
              year,
              month,
            })}
          </h2>
          <Link to={`/${Object.values(this.getNextMonth()).join("/")}/`}>
            {this.getYearAndMonthLabel(this.getNextMonth())} &raquo;
          </Link>
        </nav>
        <table>
          <thead>
            <tr>
              <th>Sunday</th>
              <th>Monday</th>
              <th>Tuesday</th>
              <th>Wednesday</th>
              <th>Thursday</th>
              <th>Friday</th>
              <th>Saturday</th>
            </tr>
          </thead>
          <tbody>
            {grid.map((week, row) => (
              <tr key={row}>
                {week.map((day, weekDay) => this.renderDay(day, weekDay))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

Calendar.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      year: PropTypes.string.isRequired,
      month: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }),
};

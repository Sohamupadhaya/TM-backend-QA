import moment from "moment-timezone"

export const formatTime = (dateTimeString: string, timeZone: string): string => {
    return moment(dateTimeString).tz(timeZone).format('hh:mm A');
};
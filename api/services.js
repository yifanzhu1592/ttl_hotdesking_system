const { sequelize, User, Desk, Booking, Group, Notification } = require("../sequelize");
const { QueryTypes, Op } = require("sequelize");
const user = require("../models/user");
const emailjs = require("emailjs-com");
const sha256 = require("js-sha256");
const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

module.exports = {
    login: async (email, password) => {
        let model = await User.findAll({
            where: {
                email: email,
                password: sha256(password),
            },
        });
        let groupModel = await Group.findAll({
            where: {
                userEmail: email,
                name: "admin",
            },
        });
        let admin = groupModel.length > 0 ? true : false;
        return model.length > 0 ? [true, admin] : [false, false];
    },
    adminCheck: async (email) => {
        let model = await Group.findAll({
            where: {
                userEmail: email,
                name: "admin",
            },
        });
        return model.length > 0 ? true : false;
    },
    getLocationData: async () => {
        let data = [];
        let rooms = await module.exports.getRoomsList();
        for (let room in rooms) {
            let deskModels = await Desk.findAll({
                where: {
                    room: rooms[room],
                },
            });
            let desks = [];
            for (let desk of deskModels) {
                desks.push(desk.getDataValue("id"));
            }
            data[room] = { name: rooms[room], desks: desks };
        }
        return data;
    },
    getRoomsList: async () => {
        let rooms = [];
        let distinctRooms = await sequelize.query("SELECT DISTINCT room FROM desks;", {
            type: QueryTypes.SELECT,
        });
        for (let room in distinctRooms) {
            rooms.push(distinctRooms[room].room);
        }
        return rooms;
    },
    getUserName: async (email) => {
        let model = await User.findByPk(email);
        let username = model.getDataValue("username");
        return username ? username : email;
    },
    setUserName: async (email, username) => {
        let model = await User.findByPk(email);
        model.username = username;
        model.save();
    },
    changePassword: async (email, password) => {
        let model = await User.findByPk(email);
        model.password = sha256(password);
        model.save();
    },
    getRooms: async () => {
        let rooms = [];
        let distinctRooms = await sequelize.query("SELECT DISTINCT room FROM desks;", {
            type: QueryTypes.SELECT,
        });
        for (let room in distinctRooms) {
            rooms.push({
                value: distinctRooms[room].room,
                label: "",
            });
        }
        return rooms;
    },
    getDesks: async (room) => {
        let desks = [];
        let models = await Desk.findAll({
            where: {
                room: room
            }
        });
        for (let model in models) {
            desks.push(models[model].getDataValue('id'));
        }
        return desks;
    },
    getGroups: async () => {
        let groups = [];
        let distinctNames = await sequelize.query("SELECT DISTINCT name FROM groups;", {
            type: QueryTypes.SELECT,
        });
        for (let group in distinctNames) {
            groups.push(distinctNames[group].name);
        }
        return groups;
    },
    getUsers: async () => {
        let users = [];
        let models = await User.findAll({
            attributes: ["email"],
        });
        for (let model in models) {
            users.push(models[model].getDataValue("email"));
        }
        return users;
    },
    getUsersInGroup: async (group) => {
        let users = [];
        let models = await Group.findAll({
            where: {
                name: group,
            },
            attributes: ["userEmail"],
        });
        for (let model in models) {
            users.push(models[model].getDataValue("userEmail"));
        }
        return users;
    },
    getBookings: async (email) => {
        let bookings = [];
        let models = await Booking.findAll({
            raw: true,
            where: {
                userEmail: email,
            },
            order: [
                ['date', 'DESC']
            ]
        });
        for (let model in models) {
            bookings.push(models[model]);
        }
        return bookings;
    },
    getBookingsOnDate: async (date) => {
        let bookings = await Booking.findAll({
            raw: true,
            where: {
                date: date
            },
            order: [
                ['deskRoom', 'ASC'],
                ['deskId', 'ASC']
            ]
        });
        return bookings;
    },
    getBookingsWithOptions: async (options) => {
        let bookings = await Booking.findAll(options);
        return [bookings.length, bookings];
    },
    getReports: async (time, room, team) => {
        let userBookingsCount = [];
        let bookings = [[], []];
        let allBookings = [];
        let bookingDistribution = [0, 0, 0, 0, 0, 0, 0];
        let users = await module.exports.getUsersInGroup(team);
        let options = {
            where: {}
        };
        if (room != 'overall') {
            options.where['deskRoom'] = room;
        }
        let today = new Date();
        switch (time) {
            case 'next week':
                options.where['date'] = {
                    [Op.gte] : today,
                    [Op.lt] : new Date(today.getFullYear(), today.getMonth(), today.getDate()+7)
                };
                break;
            case 'last week':
                options.where['date'] = {
                    [Op.gte] : new Date(today.getFullYear(), today.getMonth(), today.getDate()-7),
                    [Op.lt] : today
                };
                break;
            case 'last month':
                options.where['date'] = {
                    [Op.gte] : new Date(today.getFullYear(), today.getMonth()-1, today.getDate()),
                    [Op.lt] : today
                };
                break;
            case 'last 3 months':
                options.where['date'] = {
                    [Op.gte] : new Date(today.getFullYear(), today.getMonth()-3, today.getDate()),
                    [Op.lt] : today
                };
                break;
            case 'overall': 
                break;
            case 'default':
                break;
        }
        for (let user in users) {
            options.where['userEmail'] = users[user];
            let userBookings = await module.exports.getBookingsWithOptions(options);
            userBookingsCount[user] = userBookings[0];
            allBookings = allBookings.concat(userBookings[1]);
        }
        for (let booking in allBookings) {
            bookingDistribution[new Date(allBookings[booking].getDataValue('date')).getDay()]++;
        };
        return [users, userBookingsCount, [], [], bookingDistribution, 'Success'];
        //  Empty values are for deprecated desk report piechart
    },
    getReportsByUser: async (time, room, team) => {
        // An array of two arrays, user emails and their booking amount
        // if (time === "overall" && room === "overall") {
        //     for (let user of users) {
        //         let bookingsByUser = await module.exports.getBookings(user);
        //         amount.push(bookingsByUser.length);
        //     }
        // } else if (time === "overall" && room !== "overall") {
        //     for (let email of users) {
        //         let models = await Booking.findAll({
        //             where: {
        //                 userEmail: email,
        //                 deskRoom: room,
        //             },
        //         });
        //         amount.push(models.length);
        //     }
        // } else if (time === "last week" && room === "overall") {
        //     for (let user of users) {
        //         let counter = 0;
        //         let bookingsByUser = await module.exports.getBookings(user);
        //         for (let booking of bookingsByUser) {
        //             let diffDays = Math.ceil(
        //                 (new Date() - booking.getDataValue("date")) / (1000 * 60 * 60 * 24)
        //             );
        //             if (diffDays <= 7 && diffDays > 0) {
        //                 counter++;
        //             }
        //         }
        //         amount.push(counter);
        //     }
        // } else if (time === "last month" && room === "overall") {
        //     for (let user of users) {
        //         let counter = 0;
        //         let bookingsByUser = await module.exports.getBookings(user);
        //         for (let booking of bookingsByUser) {
        //             let diffDays = Math.ceil(
        //                 (new Date() - booking.getDataValue("date")) / (1000 * 60 * 60 * 24)
        //             );
        //             if (diffDays <= 30 && diffDays > 0) {
        //                 counter++;
        //             }
        //         }
        //         amount.push(counter);
        //     }
        // } else if (time === "last 3 months" && room === "overall") {
        //     for (let user of users) {
        //         let counter = 0;
        //         let bookingsByUser = await module.exports.getBookings(user);
        //         for (let booking of bookingsByUser) {
        //             let diffDays = Math.ceil(
        //                 (new Date() - booking.getDataValue("date")) / (1000 * 60 * 60 * 24)
        //             );
        //             if (diffDays <= 90 && diffDays > 0) {
        //                 counter++;
        //             }
        //         }
        //         amount.push(counter);
        //     }
        // } else if (time === "next week" && room === "overall") {
        //     for (let user of users) {
        //         let counter = 0;
        //         let bookingsByUser = await module.exports.getBookings(user);
        //         for (let booking of bookingsByUser) {
        //             let diffDays = Math.ceil(
        //                 (booking.getDataValue("date") - new Date()) / (1000 * 60 * 60 * 24)
        //             );
        //             if (diffDays <= 7 && diffDays > 0) {
        //                 counter++;
        //             }
        //         }
        //         amount.push(counter);
        //     }
        // } else if (time === "last week" && room !== "overall") {
        //     for (let email of users) {
        //         let counter = 0;
        //         let models = await Booking.findAll({
        //             where: {
        //                 userEmail: email,
        //                 deskRoom: room,
        //             },
        //         });
        //         for (let booking of models) {
        //             let diffDays = Math.ceil(
        //                 (new Date() - booking.getDataValue("date")) / (1000 * 60 * 60 * 24)
        //             );
        //             if (diffDays <= 7 && diffDays > 0) {
        //                 counter++;
        //             }
        //         }
        //         amount.push(counter);
        //     }
        // } else if (time === "last month" && room !== "overall") {
        //     for (let email of users) {
        //         let counter = 0;
        //         let models = await Booking.findAll({
        //             where: {
        //                 userEmail: email,
        //                 deskRoom: room,
        //             },
        //         });
        //         for (let booking of models) {
        //             let diffDays = Math.ceil(
        //                 (new Date() - booking.getDataValue("date")) / (1000 * 60 * 60 * 24)
        //             );
        //             if (diffDays <= 30 && diffDays > 0) {
        //                 counter++;
        //             }
        //         }
        //         amount.push(counter);
        //     }
        // } else if (time === "last 3 months" && room !== "overall") {
        //     for (let email of users) {
        //         let counter = 0;
        //         let models = await Booking.findAll({
        //             where: {
        //                 userEmail: email,
        //                 deskRoom: room,
        //             },
        //         });
        //         for (let booking of models) {
        //             let diffDays = Math.ceil(
        //                 (new Date() - booking.getDataValue("date")) / (1000 * 60 * 60 * 24)
        //             );
        //             if (diffDays <= 90 && diffDays > 0) {
        //                 counter++;
        //             }
        //         }
        //         amount.push(counter);
        //     }
        // } else if (time === "next week" && room !== "overall") {
        //     for (let email of users) {
        //         let counter = 0;
        //         let models = await Booking.findAll({
        //             where: {
        //                 userEmail: email,
        //                 deskRoom: room,
        //             },
        //         });
        //         for (let booking of models) {
        //             let diffDays = Math.ceil(
        //                 (booking.getDataValue("date") - new Date()) / (1000 * 60 * 60 * 24)
        //             );
        //             if (diffDays <= 7 && diffDays > 0) {
        //                 counter++;
        //             }
        //         }
        //         amount.push(counter);
        //     }
        // }

        //bookings[1] = amount;
        return bookings;
    },
    getBookingsInMonth: async (room, date, am, pm) => {
        let dateComp = date.split("-");
        let desks = [];
        let existingBookings = [];
        let daysInMonth = new Date(
            parseInt(dateComp[0]),
            parseInt(dateComp[1]) - 1,
            0
        ).getDate();

        let deskModel = await Desk.findAll({
            where: {
                room: room,
            },
        });
        for (let desk of deskModel) {
            desks.push(desk.getDataValue("id"));
        }
        for (let day = 0; day <= daysInMonth; day++) {
            existingBookings[day] = [];
            let whereClause;
            //If full day requested, check for either am or pm being booked.
            if (am && pm) {
                whereClause = {
                    deskRoom: room,
                    date: new Date(parseInt(dateComp[0]), parseInt(dateComp[1]) - 1, day + 1),
                    [Op.or]: [{ am: true }, { pm: true }],
                };
            } else {
                //Else if am or pm requested, add them accordingly, with the other being absent since we don't care.
                whereClause = {
                    deskRoom: room,
                    date: new Date(parseInt(dateComp[0]), parseInt(dateComp[1]) - 1, day + 1),
                };
                if (am) whereClause["am"] = true;
                if (pm) whereClause["pm"] = true;
            }
            let bookings = await Booking.findAll({
                where: whereClause,
            });
            for (let booking in bookings) {
                existingBookings[day].push({
                    user: bookings[booking].getDataValue("userEmail"),
                    desk: bookings[booking].getDataValue("deskId"),
                });
            }
        }
        return [desks, existingBookings];
    },
    getNotifications: async () => {
        let notifications = [];
        let models = await Notification.findAll({
            raw: true,
            where: {
                end: {
                    [Op.gt]: new Date(),
                },
            },
        });
        for (let model in models) {
            notifications.push(models[model]);
        }
        return notifications;
    },
    addUser: async (email) => {
        let password = email;
        let options = {
            from: process.env.EMAIL,
            to: email,
            subject: 'ttl_hotdesking Account',
            text: 'Email: ' + email + '\nPassword: ' + password
        };
        // transporter.sendMail(options, (err) => {
        //     console.log(err);
        //     throw(err);
        // });
        await User.create({ email: email, password: sha256(password) });
        await Group.create({ userEmail: email, name: "All Users" });
    },
    addDesk: async (id, room) => {
        let arr = [];
        for (let desk of id) {
            arr.push({ id: desk, room: room });
        }
        console.log(id, arr);
        await Desk.bulkCreate(arr);
    },
    addBooking: async (email, id, room, date, am, pm) => {
        let options = {
            from: process.env.EMAIL,
            to: email,
            subject: 'ttl_hotdesking Booking Confirmation',
            text: `Your booking for ${room} desk ${id} on ${date} has been confirmed`
        };
        await Booking.create({
            userEmail: email,
            deskId: id,
            deskRoom: room,
            date: date,
            am: am,
            pm: pm,
        });
        // transporter.sendMail(options, (err) => {
        //     console.log(err);
        //     throw err;
        // });
    },
    addRoomRestriction: async (email, room, date, am, pm) => {
        let bookings = [];
        let desks = await module.exports.getDesks(room);
        for (desk in desks) {
            bookings.push({
                userEmail: email,
                deskId: desks[desk],
                deskRoom: room,
                date: date,
                am: am,
                pm: pm,
            });
        }
        await Booking.bulkCreate(bookings);
    },
    addUserToGroup: async (email, group) => {
        await Group.create({ name: group, userEmail: email });
    },
    addNotification: async (end, type, title, body) => {
        await Notification.create({
            start: new Date(),
            end: end,
            type: type,
            title: title,
            body: body,
        });
    },
    removeUser: async (email) => {
        let model = await User.findByPk(email);
        model.destroy();
    },
    removeDesk: async (id, room) => {
        let model = await Desk.findOne({
            where: {
                id: id,
                room: room,
            },
        });
        model.destroy();
    },
    removeRoom: async (room) => {
        let models = await Desk.findAll({
            where: {
                room: room,
            },
        });
        for (let model in models) {
            models[model].destroy();
        }
    },
    removeBooking: async (email, id, room, date, am, pm) => {
        console.log(email, id, room, date, am, pm);
        let model = await Booking.findOne({
            where: {
                userEmail: email,
                deskId: id,
                deskRoom: room,
                date: date,
                am: am,
                pm: pm,
            },
        });
        model.destroy();
    },
    removeUserFromGroup: async (email, group) => {
        let model = await Group.findOne({
            where: {
                name: group,
                userEmail: email,
            },
        });
        model.destroy();
    },
};

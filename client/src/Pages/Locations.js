import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import { createUniqueID } from "../Components/Misc";
import "../public/css/main.css";

class Locations extends Component {
  state = {
    addRoom: "",
    deleteRoom: "",
    addDeskNum: "",
    addDeskRoom: "",
    deleteDeskNum: "",
    deleteDeskRoom: "",
    deleteDeskList: [],
    desks: [],
    roomDeskList: [],
    key: "default",
  };

  componentDidUpdate = () => {
    fetch("/api/getLocationData", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        if (res.error) {
          console.log("error fetching location data");
        } else {
          this.setState({ roomDeskList: res.data });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  componentDidMount = () => {
    window.scrollTo(0, 0);
    fetch("/api/getLocationData", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        if (res.error) {
          console.log("error fetching location data");
        } else {
          this.setState({ roomDeskList: res.data });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  submitAddRoom = (room) => {
    this.setState({ key: createUniqueID() });
    fetch("/api/addRoom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        room: room,
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        if (res.error) {
          console.log(res.message);
        } else {
          alert("Success");
        }
      })
      .catch((err) => {
        alert(err);
      });
  };

  submitAddDesk = (desk, room) => {
    this.setState({ key: createUniqueID() });
    fetch("/api/addDesk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        desk: desk,
        room,
        room,
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        if (res.error) {
          alert(res.message);
        } else {
          alert("Success");
        }
      })
      .catch((err) => {
        alert(err);
      });
  };

  submitRemoveDesk = (desk, room) => {
    this.setState({ key: createUniqueID() });
    fetch("/api/removeDesk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        desk: desk,
        room: room,
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        if (res.error) {
          alert(res.message);
        } else {
          alert("Success");
        }
      });
  };

  submitRemoveRoom = (room) => {
    this.setState({ key: createUniqueID() });
    fetch("/api/removeRoom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        room: room,
      }),
    })
      .then((res) => {
        return res.json();
      })
      .then((res) => {
        if (res.error) {
          alert(res.message);
        } else {
          alert("Success");
        }
      })
      .catch((err) => {
        alert(err);
      });
  };

  handleEvent = (event) => {
    this.setState({ [event.target.name]: event.target.value });
  };

  addRoomF = (event) => {
    this.setState({ addRoom: event.target.value });
  };

  deleteRoomF = (event) => {
    this.setState({ deleteRoom: event.target.value });
  };

  addDeskNumF = (event) => {
    this.setState({ addDeskNum: event.target.value });
  };

  addDeskRoomF = (event) => {
    this.setState({ addDeskRoom: event.target.value });
  };

  deleteDeskNumF = (event) => {
    this.setState({ deleteDeskNum: event.target.value });
  };

  deleteDeskRoomF = (event) => {
    this.setState({ deleteDeskRoom: event.target.value });
  };

  listDesks = (room) => {
    return (
      <div
        style={{
          display: "flex",
          flexFlow: "row wrap",
          justifyContent: "center",
          marginTop: "20px",
          width: "100%",
        }}
      >
        <span className="page-divider-header" style={{ margin: "0px" }}>
          {room.name}
        </span>
        <div style={{ width: "100%", margin: "10px" }} />
        {room.desks.length === 0 ? (
          <span
            style={{
              fontWeight: "bold",
              width: "16%",
              marginBottom: "10px",
            }}
          >
            No desks listed
          </span>
        ) : (
          room.desks.map((x) => {
            return (
              <>
                <span
                  style={{
                    fontWeight: "bold",
                    width: "16%",
                    marginBottom: "10px",
                  }}
                >
                  {"Desk " + x}
                </span>
              </>
            );
          })
        )}
      </div>
    );
  };

  render() {
    return sessionStorage.__user_is_admin__ ? (
      <div>
        <div className="wrapper TCD-BG" key={this.state.key}>
          <div className="flex-container-1" />
          <div className="flex-container-5 main-body">
            <div className="quadrant-container">
              <div className="quadrant">
                <h1
                  className="page-divider-header"
                  style={{ backgroundColor: "#4dc300", marginLeft: "2.5%" }}
                >
                  Add Locations
                </h1>
                <div
                  style={{
                    width: "100%",
                    marginTop: "5%",
                    marginBottom: "10%",
                  }}
                />
                <input
                  className="text-input"
                  type="text"
                  placeholder="Location display name"
                  name="addRoom"
                  onChange={this.handleEvent}
                ></input>
                <div style={{ width: "100%", marginTop: "5%", marginBottom: "5%" }} />
                <button
                  className="button-style"
                  onClick={(e) => this.submitAddRoom(this.state.addRoom)}
                >
                  Add Location
                </button>
              </div>
              <div className="quadrant">
                <h1
                  className="page-divider-header"
                  style={{ backgroundColor: "#4dc300", marginLeft: "2.5%" }}
                >
                  Add Desks
                </h1>
                <div
                  style={{
                    width: "100%",
                    marginTop: "5%",
                    marginBottom: "10%",
                  }}
                />
                <select
                  className="text-input"
                  style={{ padding: "0" }}
                  name="addDeskRoom"
                  onChange={this.handleEvent}
                >
                  <option value="">Select location</option>
                  {this.state.roomDeskList
                    ? this.state.roomDeskList.map((x) => {
                        return <option value={x.name}>{x.name}</option>;
                      })
                    : null}
                </select>
                <div
                  style={{
                    width: "100%",
                    marginTop: "1%",
                  }}
                />
                <input
                  className="text-input"
                  placeholder="Desk Number"
                  type="text"
                  name="addDeskNum"
                  onChange={this.handleEvent}
                ></input>
                <div
                  style={{
                    width: "100%",
                    marginTop: "5%",
                  }}
                />
                <button
                  className="button-style"
                  onClick={() =>
                    this.submitAddDesk(this.state.addDeskNum, this.state.addDeskRoom)
                  }
                >
                  Add Desk
                </button>
              </div>
              <div className="quadrant">
                <h1
                  className="page-divider-header"
                  style={{ backgroundColor: "#F32000", marginLeft: "2.5%" }}
                >
                  Remove Locations
                </h1>
                <div
                  style={{
                    width: "100%",
                    marginTop: "5%",
                    marginBottom: "10%",
                  }}
                />
                <select
                  className="text-input"
                  name="deleteRoom"
                  style={{ padding: "0" }}
                  onChange={this.handleEvent}
                >
                  <option value="">Select location</option>
                  {this.state.roomDeskList
                    ? this.state.roomDeskList.map((x) => {
                        return <option value={x.name}>{x.name}</option>;
                      })
                    : null}
                </select>
                <div
                  style={{
                    width: "100%",
                    marginTop: "5%",
                    marginBottom: "5%",
                  }}
                />
                <button
                  className="button-style"
                  onClick={(e) => this.submitRemoveRoom(this.state.deleteRoom)}
                >
                  Remove Location
                </button>
              </div>
              <div className="quadrant">
                <h1
                  className="page-divider-header"
                  style={{ backgroundColor: "#F32000", marginLeft: "2.5%" }}
                >
                  Remove Desks
                </h1>
                <div
                  style={{
                    width: "100%",
                    marginTop: "5%",
                    marginBottom: "10%",
                  }}
                />
                <select
                  className="text-input"
                  style={{ padding: "0" }}
                  onChange={(e) =>
                    this.setState({ deleteDeskRoom: e.target.value }, () => {
                      for (let key in this.state.roomDeskList) {
                        if (this.state.roomDeskList[key].name === this.state.deleteDeskRoom) {
                          this.setState({
                            deleteDeskList: this.state.roomDeskList[key].desks,
                          });
                          break;
                        }
                      }
                    })
                  }
                >
                  <option value="">Select location</option>
                  {this.state.roomDeskList
                    ? this.state.roomDeskList.map((x) => {
                        return <option value={x.name}>{x.name}</option>;
                      })
                    : null}
                </select>
                <div
                  style={{
                    width: "100%",
                    marginTop: "1%",
                  }}
                />
                <select
                  className="text-input"
                  name="deleteDeskRoom"
                  style={{ padding: "0" }}
                  onChange={this.handleEvent}
                >
                  <option value="">Select desk</option>
                  {this.state.deleteDeskList
                    ? this.state.deleteDeskList.map((x) => {
                        return <option value={x}>{"Desk " + x}</option>;
                      })
                    : null}
                </select>
                <div
                  style={{
                    width: "100%",
                    marginTop: "5%",
                    marginBottom: "5%",
                  }}
                />
                <button
                  className="button-style"
                  onClick={(e) =>
                    this.submitRemoveDesk(this.state.deleteDeskNum, this.state.deleteDeskRoom)
                  }
                >
                  Remove Desk
                </button>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexFlow: "column wrap",
                width: "100%",
              }}
              key={this.state.roomDeskList}
            >
              {this.state.roomDeskList
                ? this.state.roomDeskList.map((x) => {
                    return this.listDesks(x);
                  })
                : null}
            </div>
            <div style={{ width: "100%", marginBottom: "20px" }} />
          </div>
          <div className="flex-container-1" />
        </div>
      </div>
    ) : (
      <Redirect to="/home" />
    );
  }
}

export default Locations;

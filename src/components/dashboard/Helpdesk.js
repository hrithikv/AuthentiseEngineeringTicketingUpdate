import React, { Component } from 'react';
import { apiurl } from '../../helpers/constants';
import { Table, Row, Col, Jumbotron, Button } from 'react-bootstrap';
import firebase from 'firebase';

class Helpdesk extends Component {
    constructor(props){
        super(props);

        this.changeUpdatePriority = this.changeUpdatePriority.bind(this);
        this.changeUpdateLevel = this.changeUpdateLevel.bind(this);

    }

    state = {
        tickets: [],
        selectedTicket: null,
        techUsers: [],
        selectedTech: null,
        updatePriority: null,
        updateLevel: null
    }

    componentDidMount() {
        fetch(apiurl + '/progressCRUD/list')
            .then((response) => response.json())
            .then((responseJson) => {
                const pendingTickets = [];
                for(const ele in responseJson) {
                    firebase.database().ref('ticket/'+responseJson[ele].id).on('value', (snapshot) => {
                        if(snapshot.val() === null) {
                            pendingTickets.push(responseJson[ele]);

                            this.forceUpdate();
                        }
                    })
                }
                return pendingTickets;
            })
            .then((tickets) => {
                this.setState({
                    tickets: tickets
                });
            })

        const users = firebase.database().ref('user/')
        users.on('value', (snapshot) => {
            const tempTech = [];
            for(const ele in snapshot.val()) {
                if(snapshot.val()[ele].type === 'tech') {
                    tempTech.push(snapshot.val()[ele]);
                }
            }
            this.setState({
                techUsers: tempTech
            });
        })
    }

    changeUpdatePriority(event) {
        this.setState({updatePriority: event.target.value});
    }
    changeUpdateLevel(event) {
        this.setState({updateLevel: event.target.value});
    }

    ticketDetailsClick = (ticket) => {
        const { selectedTicket} = this.state;
        this.setState({
            selectedTicket: (selectedTicket !== null && selectedTicket.id === ticket.id ? null : ticket),
            updatePriority: ticket.priority,
            updateLevel: ticket.escLevel,
        });
    }

    closeDialogClick = () => {
        this.setState({
            selectedTicket: null
        })
    }

    handleTechChange = (e) => {
        this.setState({
            selectedTech: e.target.value
        });
    }


    assignTicketToTech = () => {
        const { selectedTicket, updatePriority, updateLevel} = this.state;
        var escLevel = updateLevel;
        var priority = updatePriority;
        var id = selectedTicket.id;

        if(this.state.selectedTech === null) {
            return;
        }
        fetch(apiurl+"/progressCRUD/"+id+"/helpdesk", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id : id,
                priority : priority,
                escLevel: escLevel,
            })
        }).then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.status === "SUCCESS") {

                } else {
                    alert("Could not update ticket.")
                }
            })

        const data = {};
        data['ticket/' + this.state.selectedTicket.id] = {
            ticket_id: this.state.selectedTicket.id,
            user_id: this.state.selectedTech // stored Tech ID
        };
        
        firebase.database().ref().update(data)
        alert('Tech successfully assigned to ticket!');
        window.location.reload();
    }

    render () {
        const vm = this
        const { selectedTicket, tickets, techUsers, updateLevel, updatePriority } = this.state
        const changeUpdatePriority = this.changeUpdatePriority;
        const changeUpdateLevel = this.changeUpdateLevel;
        return (
            <div>
                <Row>
                    <Col md={(selectedTicket !== null ? 7 : 12)}>
                        <h1>Pending Tickets</h1>
                        {tickets.length < 1 && (
                            <p className="alert alert-info">There are no tickets to display.</p>
                        )}
                        <Table striped hover>
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Operating System</th>
                                <th>Software Issue</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {tickets.map((ticket, i) => (
                                <tr key={i}>
                                    <td>{ticket.id}</td>
                                    <td>{ticket.OS}</td>
                                    <td>{ticket.softwareIssue}</td>
                                    <td>
                                        <Button bsStyle={vm.state.selectedTicket !== null && vm.state.selectedTicket.id === ticket.id ? 'success' : 'info'} onClick={() => vm.ticketDetailsClick(ticket)}>More Details</Button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    </Col>
                    {selectedTicket !== null && (
                        <Col md={5}>
                            <Jumbotron style={{padding: 10}}>
                                <Button block bsStyle="danger" onClick={this.closeDialogClick}>Close Dialog</Button>
                                <h3 className="text-uppercase">Ticket Details</h3>
                                <p><b>ID: </b>{selectedTicket.id}</p>
                                <p><b>Issue: </b><br/>{selectedTicket.softwareIssue}</p>
                                <p><b>Operating System: </b><br/>{selectedTicket.OS}</p>
                                <p><b>Details: </b><br/>{selectedTicket.additionalComments}</p>
                                {techUsers.length > 0 && (
                                    <div>
                                        <hr/>
                                        <h3 className="text-uppercase">Priority Level</h3>
                                        <select className="form-control" value={updatePriority} onChange={changeUpdatePriority}
                                                defaultValue="-1">
                                            <option value="-1" defaultValue disabled>Select a Priority</option>
                                                <option value="Low">Low</option>
                                                <option value="Moderate">Moderate</option>
                                                <option value="High">High</option>
                                        </select>

                                        <h3 className="text-uppercase">Escalation Level</h3>
                                        <select className="form-control" value={updateLevel} onChange={changeUpdateLevel}
                                                defaultValue="-1">
                                            <option value="-1" defaultValue disabled>Select a Level</option>
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                        </select>

                                        <h3 className="text-uppercase">Assign to tech</h3>
                                        <select className="form-control" onChange={this.handleTechChange} defaultValue="-1">
                                            <option value="-1" defaultValue disabled>Select a tech user</option>
                                            {techUsers.map((user, i) => (
                                                <option key={i} value={user.id}>{user.name}</option>
                                            ))}
                                        </select>

                                        <div className="clearfix"><br/>
                                            <Button className="pull-right" bsStyle="success" onClick={this.assignTicketToTech}>Assign</Button>
                                        </div>
                                    </div>
                                )
                                }
                            </Jumbotron>
                        </Col>
                    )}
                </Row>
            </div>
        );
    }
}

export default Helpdesk;

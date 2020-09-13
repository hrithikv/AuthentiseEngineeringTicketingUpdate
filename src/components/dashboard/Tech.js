import React, { Component } from 'react';
import { apiurl } from "../../helpers/constants";
import firebase from 'firebase';
import { Panel, Button, Row, Jumbotron, } from 'react-bootstrap';
import { Editor } from 'react-draft-wysiwyg';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { EditorState } from 'draft-js';


class Tech extends Component {
    constructor(props){
        super(props);

        this.changeUpdateStatus = this.changeUpdateStatus.bind(this);
        this.changeUpdateLevel = this.changeUpdateLevel.bind(this);
    }

    state = {
        tickets: [],
        selectedTicket: null,
        escLevel: null,
        view:"list",
        updateStatus: null,
        updateLevel: null,
        editorState: EditorState.createEmpty(),

    }

    componentDidMount() {
        fetch(apiurl + '/progressCRUD/list')
            .then((response) => response.json())
            .then((responseJson) => {

            console.log(responseJson);
                const myTickets = [];
                for(const ele in responseJson) {
                    firebase.database().ref('ticket/'+responseJson[ele].id).on('value', (snapshot) => {

                        if(snapshot.val() !== null
                            && snapshot.val().user_id === this.props.user.uid
                            && (responseJson[ele].status === "In progress" || responseJson[ele].status === "Pending")) {
                            
                            myTickets.push(responseJson[ele]);

                            this.forceUpdate();
                        }
                    })
                }
                return myTickets;
            })
            .then((tickets) => {
                this.setState({
                    tickets: tickets
                });
            })
    }
           
    changeUpdateStatus(event) {
        this.setState({updateStatus: event.target.value});
    }
    changeUpdateLevel(event) {
        this.setState({updateLevel: event.target.value});
    }
    onEditorStateChange = (editorState) => {
        console.log(editorState.getCurrentContent().getPlainText())
        this.setState({editorState,});
    };

    ticketDetailsClick = (ticket) => {
        const { selectedTicket } = this.state;
        this.setState({
            selectedTicket: (selectedTicket !== null && selectedTicket.id === ticket.id ? null : ticket),
            updateStatus: ticket.status,
            updateReply: ticket.Reply,
            updateLevel: ticket.escLevel,
            view: "update"
        });
    }

    closeDialogClick = () => {
        this.setState({
            selectedTicket: null,
            view: "list"
        })
    }


    changeLevel = () =>{
        const { selectedTicket, updateLevel} = this.state;
        var escLevel = updateLevel;
        var id = selectedTicket.id;

        fetch(apiurl+"/progressCRUD/"+id+"/tech", {
            method: 'POST',   
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id : id,
               escLevel: escLevel,
            })
        }).then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.status === "ERROR") {
                    alert("Could not change ticket's escalation level.")
                } else {
                    alert("Successfully changed ticket's escalation level!")
                }
            })

        firebase.database().ref().child('ticket/' + this.state.selectedTicket.id).remove()
        this.setState({view: "list"})
        window.location.reload()
    }

    submitUpdate = () => {
        const { selectedTicket, editorState, updateStatus} = this.state;
        var status = updateStatus;
        var reply = editorState.getCurrentContent().getPlainText();
        var id = selectedTicket.id;


        fetch(apiurl+"/progressCRUD/"+id+"/update", {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id : id,
                Status : status,
                Reply: reply,
            })
        }).then((response) => response.json())
            .then((responseJson) => {
                if (responseJson.status === "ERROR") {
                    alert("Could not update ticket.")
                } else {
                    alert("Ticket successfully updated.")
                }
            })

            this.setState({
                selectedTicket: null,
                view: "list"})
            window.location.reload();
    }


    render () {
        const { tickets, selectedTicket, updateStatus, editorState, updateLevel } = this.state;
        const changeUpdateStatus = this.changeUpdateStatus;
        const changeUpdateLevel = this.changeUpdateLevel;

        return (
            <div>
                <Row>
                <h1>My Tickets</h1>
                        {this.state.view === "list" ?
                            <div>
                            {tickets.length < 1 ? (
                                    <div className="alert alert-info">You have not been assigned any tickets.</div>
                                )
                                : tickets.map((ticket, i) => (
                                    <Panel key={i} header={ticket.softwareIssue}>
                                        <p>{ticket.additionalComments}
                                            <Button className="pull-right"
                                                    bsStyle={this.state.selectedTicket !== null && this.state.selectedTicket.id === ticket.id ? 'success' : 'info'}
                                                    onClick={() => this.ticketDetailsClick(ticket)}>More Details</Button>
                                            {(ticket.status === "Resolved" || ticket.status === "Unsolved") && (
                                                <Button className="pull-right techCloseTicket"
                                                        bsStyle="danger" onClick={() => this.closeTicket(ticket)}>Close Ticket</Button>
                                            )}
                                        </p>
                                    </Panel>
                                ))}
                            </div>
                            :null
                        }
                    {this.state.view === "update" ?
                        <div>
                        {selectedTicket !== null && (
                                <Jumbotron style={{padding: 10}}>
                                    <Button className="pull-right" bsStyle="info" onClick={this.closeDialogClick}>Go Back</Button>
                                    <h3 className="text-uppercase">Ticket Details</h3>
                                    <p><b>ID: </b>{selectedTicket.id}</p>
                                    <p><b>Issue: </b><br/>{selectedTicket.softwareIssue}</p>
                                    <p><b>Operating System: </b><br/>{selectedTicket.OS}</p>
                                    <p><b>Details: </b><br/>{selectedTicket.additionalComments}</p>
                                    <p><b>Priority: </b><br/>{selectedTicket.priority}</p>
                                    <hr/>

                                        <h3 className="text-uppercase">Reply</h3>

                                    <Editor 
                                        editorState={editorState}
                                        toolbarClassName="toolbarClassName"
                                        wrapperClassName="demo-wrapper"
                                        editorClassName="demo-editor"
                                        onEditorStateChange={this.onEditorStateChange}
                                    />
                                        <div>
                                            <h3 className="text-uppercase">Status</h3>
                                            <select className="form-control" value={updateStatus} onChange={changeUpdateStatus}
                                                    defaultValue="Pending">
                                                <option value="Pending" defaultValue disabled>Pending</option>
                                                <option value="In progress">In Progress</option>
                                                <option value="Unsolved">Unsolved</option>
                                                <option value="Resolved">Resolved</option>
                                            </select>
                                        </div>
                                    <div className="clearfix"><br/>
                                        <Button className="pull-right" bsStyle="success" onClick={this.submitUpdate}>Update</Button>
                                    </div>

                                        <hr/>
                                        <h3 className="text-uppercase">Change Escalation Level</h3>
                                         <h4>If ticket is not suitable for you</h4>
                                        <select className="form-control" value={updateLevel} onChange={changeUpdateLevel}
                                                defaultValue="-1">
                                            <option value="-1" defaultValue disabled>Change Level</option>
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                        </select>

                                        <div className="clearfix"><br/>
                                            <Button className="pull-right" bsStyle="primary" onClick={this.changeLevel}>Change</Button>
                                        </div>
                                </Jumbotron>
                        )}
                        </div>
                        :null
                    }
                </Row>
            </div>
        );
    }
}
export default Tech;

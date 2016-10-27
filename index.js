var google = require('googleapis');

function googleGroupManager(specs) {
    "use strict";
    var auth;
    var service = google.admin('directory_v1');

    function getGroups() {
        var groupsSet = {
            "kind": "admin#directory#groups",
            groups: []
        };

        return new Promise(function (resolve, reject) {
            function listGroups(pageToken) {
                service.groups.list({
                    auth: auth,
                    fields: "nextPageToken, groups/name, groups/email, groups/adminCreated",
                    customer: 'my_customer',
                    maxResults: 250,
                    pageToken: pageToken
                }, function (err, response) {
                    if (err) {
                        reject('The API returned an error: ' + err);
                        return;
                    }
                    var groups = response.groups;


                    if (groups.length === 0) {
                        resolve(groupsSet);
                        return;
                    }
                    groups.forEach(function (group) {
                        groupsSet.groups.push(group);
                    });
                    if (!response.nextPageToken) {
                        resolve(groupsSet);
                        return;
                    }
                    listGroups(response.nextPageToken);
                });
            }
            listGroups();
        });
    }

    function getGroupMembers(specs) {
        var groupEmail = specs.email;
        var returnJson = specs.returnJson;
        var memberSet = {
            "kind": "admin#directory#members",
            "domainAccess": false,
            "hasNested": false,
            members: [],
            membersJson: {}
        };

        return new Promise(function (resolve, reject) {
            function listGroupMembers(pageToken) {
                service.members.list({
                    groupKey: groupEmail,
                    auth: auth,
                    fields: "nextPageToken, members",
                    maxResults: 250,
                    pageToken: pageToken
                }, function (err, response) {
                    if (err) {
                        console.log('The listGroupMembers API returned an error: ' + groupEmail + " " + err);
                        return;
                    }
                    var members = response.members;
                    if (!members || members.length === 0) {
                        resolve(memberSet);
                        return;
                    }
                    members.forEach(function (member) {
                        if (member.type === "CUSTOMER") {
                            memberSet.domainAccess = true;
                        }
                        if (member.type === "GROUP") {
                            memberSet.hasNested = true;
                        }
                        memberSet.members.push(member);
                        if (returnJson) {
                            memberSet.membersJson[member.email] = member;
                        }
                    });
                    if (!response.nextPageToken) {
                        resolve(memberSet);
                        return;
                    }
                    listGroupMembers(response.nextPageToken);
                });
            }
            listGroupMembers();
        });
    }

    auth = specs.auth;
    return {
        getGroups: getGroups,
        getGroupMembers: getGroupMembers
    };
}

module.exports = googleGroupManager;
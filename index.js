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
                    fields: "nextPageToken, groups/name, groups/email",
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
                        groupsSet.groups.push([{
                            name: group.name,
                            emal: group.email
                        }]);
                    });
                    if (!response.nextPageToken) {
                        resolve(groupsSet);
                        return;
                    }
                    getGroups(response.nextPageToken);
                });
            }
            listGroups();
        });
    }

    function getGroupMembers(specs) {
        var groupEmail = specs.groupEmail;
        var memberSet = {
            "kind": "admin#directory#members",
            "domainAccess": false,
            "hasNested": false,
            members: []
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
                        console.log('The API returned an error: ' + err);
                        return;
                    }
                    var members = response.members;

                    if (members.length === 0) {
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
                        console.log(member);
                        memberSet.members.push([member]);
                    });
                    if (!response.nextPageToken) {
                        resolve(memberSet);
                        return;
                    }
                    getGroupMembers(response.nextPageToken);
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

module.exports = {
    googleGroupManager: googleGroupManager
};
# -*- coding: utf-8 -*-
import sys
import csv
import json

def main(source_file):
    data = {}
    count = 0

    skip_first_line = True

    f = open(source_file, 'r')
    for row in csv.reader(f):
        if skip_first_line:
            skip_first_line = False
            continue

        if row[1] and row[2] and row[3]:
            # print row[1].decode('utf-8')
            # print row[2].decode('utf-8')
            # print row[3].decode('utf-8')
            count = count + 1

            if not row[1] in data:
                data[row[1]] = {}

            if not row[2] in data[row[1]]:
                data[row[1]][row[2]] = []

            if row[3] not in data[row[1]][row[2]]:
                data[row[1]][row[2]].append(row[3])

    f.close()

    print count

    for city in data:
        filename = city + '.json'
        with open(filename, 'w') as outfile:
            json.dump(data[city], outfile)

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print "error: need source_file.csv"
        sys.exit()

    sys.exit(main(sys.argv[1]))
